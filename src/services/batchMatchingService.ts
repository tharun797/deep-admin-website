import { db } from "../firebase";

import {
  collection,
  doc,
  getDocs,
  query,
  where,
  writeBatch,
  serverTimestamp,
  deleteField,
  setDoc,
  updateDoc,
  FieldValue
} from "firebase/firestore";

import { MatchingService } from "../services/matchingService";
import { ResetMatchesService } from "./resetMatchesService";
// import { ProfileDatabase } from "../db/profileDatabase";
import { FirestoreUser, UserPromptStatus } from "../types";

export class BatchMatchingService {
  
  private matchingService: MatchingService;
  private resetMatchesService : ResetMatchesService;
  // private profileDatabase: ProfileDatabase;
  private static readonly TAG = 'EnhancedBatchMatchingService';

  static readonly POTENTIAL_MATCH_MIN_THRESHOLD = 0.5;
  static readonly POTENTIAL_MATCH_MAX_THRESHOLD = 0.59;

  constructor() {
    this.matchingService = new MatchingService();
   this. resetMatchesService = new ResetMatchesService();
    // this.profileDatabase = new ProfileDatabase();
  }

  async processAllUsersMatching(): Promise<void> {
    try {
         await this.resetMatchesService.resetAllMatches();

      

      console.info(
        `${BatchMatchingService.TAG}: Starting enhanced batch matching process for all users`
      );

      const usersRef = collection(db, "users");

      const usersQuery = query(
        usersRef,
        where("verificationStatus", "==", "verified"),
        where("matchExpired", "==", true),
        where("userType", "==", "test")
      );

      const usersSnapshot = await getDocs(usersQuery);

      if (usersSnapshot.empty) {
        console.info(`${BatchMatchingService.TAG}: No users found in the database`);
        return;
      }

      await this._resetExistingMatches();

      const allDocs = usersSnapshot.docs;

      // Separate priority users by premium status
      const priorityPremiumDocs = allDocs
        .filter(
          (doc) =>
            doc.data().prioritizeNextMatch === true &&
            doc.data().isPremium === true
        )
        .sort(() => Math.random() - 0.5); // Shuffle

      const priorityFreeDocs = allDocs
        .filter(
          (doc) =>
            doc.data().prioritizeNextMatch === true &&
            doc.data().isPremium !== true
        )
        .sort(() => Math.random() - 0.5); // Shuffle

      const remainingDocs = allDocs.filter(
        (doc) => doc.data().prioritizeNextMatch !== true
      );

      // Further separate remaining users by premium status
      const premiumDocs = remainingDocs
        .filter((doc) => doc.data().isPremium === true)
        .sort(() => Math.random() - 0.5); // Shuffle

      const freeDocs = remainingDocs
        .filter((doc) => doc.data().isPremium !== true)
        .sort(() => Math.random() - 0.5); // Shuffle

      // Process in order: Priority Premium -> Premium -> Priority Free -> Free
      const users = [
        ...priorityPremiumDocs,
        ...premiumDocs,
        ...priorityFreeDocs,
        ...freeDocs,
      ];

      console.info(`${BatchMatchingService.TAG}: Found ${users.length} users to process`);
      console.info(
        `${BatchMatchingService.TAG}: Priority Premium users: ${priorityPremiumDocs.length}`
      );
      console.info(`${BatchMatchingService.TAG}: Premium users: ${premiumDocs.length}`);
      console.info(
        `${BatchMatchingService.TAG}: Priority Free users: ${priorityFreeDocs.length}`
      );
      console.info(`${BatchMatchingService.TAG}: Free users: ${freeDocs.length}`);

    //  const kTestMode = import.meta.env.VITE_TEST_MODE === 'true';

      // if (!kTestMode) {
        await setDoc(
          doc(db, "appConfig", "settings"),
          { matchingAlgorithmBegin: true },
          { merge: true }
        );
      // }

      // Convert Firestore docs to FirestoreUser objects
      const profiles: FirestoreUser[] = [];
      for (const userDoc of users) {
        const userId = userDoc.id;
        const userData = userDoc.data();

        // Get user prompts from Firestore
        const userPrompts: UserPromptStatus[] = [];
        try {
          const promptsRef = collection(db, "users", userId, "answeredPrompts");
          const promptsSnapshot = await getDocs(promptsRef);

          for (const promptDoc of promptsSnapshot.docs) {
            userPrompts.push(
              UserPromptStatus.fromFirestore(promptDoc.data(), promptDoc.id)
            );
          }
        } catch (e) {
          console.error(
            `${BatchMatchingService.TAG}: Error fetching prompts for user ${userId}:`,
            e
          );
        }

        const history: string[] = [];

        try {
          const historyRef = collection(db, "users", userId, "history");
          const historySnapshot = await getDocs(historyRef);

          for (const historyDoc of historySnapshot.docs) {
            history.push(historyDoc.id);
          }
        } catch (e) {
          console.error(
            `${BatchMatchingService.TAG}: Error fetching history for user ${userId}:`,
            e
          );
        }

        // Create ProfileState object
        profiles.push(
          FirestoreUser.fromMap(userData, userPrompts, userId, history)
        );
      }

      console.info(`${BatchMatchingService.TAG}: Loaded ${profiles.length} profiles into memory`);

      // Track matched and unmatched users
      const matchedUserIds = new Set<string>();
      const unmatchedUserIds: string[] = [];
      
      // Keep track of remaining available profiles in memory
      const availableProfiles = new Set<string>(profiles.map(p => p.id!));

      // Process matching for each user
      for (const profile of profiles) {
        const userId = profile.id;
        if (!userId) continue;

        if (userId === 'tharun7o7now@gmail.com') {
          unmatchedUserIds.push(userId);
        }

        // Skip if this user was already matched in this batch
        if (matchedUserIds.has(userId)) {
          console.info(
            `${BatchMatchingService.TAG}: User ${userId} was already matched in this batch, skipping`
          );
          continue;
        }

        // Check if this user is still available (might have been matched already)
        if (!availableProfiles.has(userId)) {
          console.info(
            `${BatchMatchingService.TAG}: User ${userId} was already matched, skipping`
          );
          continue;
        }

        console.info(`${BatchMatchingService.TAG}: Finding matches for user ${userId}`);

        try {
          // Get available profiles for matching (exclude already matched users)
          const candidateProfiles = profiles.filter(
            p => p.id !== userId && availableProfiles.has(p.id!)
          );

          // Call the matching service to find the best match
          const matchedUserId = await this.matchingService.findBestMatchForUser(
            profile,
            candidateProfiles
          );

          // If a match was made, remove both users from available pool and track them
          if (matchedUserId) {
            matchedUserIds.add(userId);
            matchedUserIds.add(matchedUserId);
            availableProfiles.delete(userId);
            availableProfiles.delete(matchedUserId);

            console.info(
              `${BatchMatchingService.TAG}: Match created between ${userId} and ${matchedUserId}`
            );
          } else {
            // No match found for this user
            unmatchedUserIds.push(userId);
            console.info(`${BatchMatchingService.TAG}: No match found for user ${userId}`);
          }
        } catch (e) {
          console.error(
            `${BatchMatchingService.TAG}: Error finding match for user ${userId}:`,
            e
          );
          // Add to unmatched list if there was an error
          unmatchedUserIds.push(userId);
        }
      }

      if (profiles.length === 0) {
        console.debug('Profiles are empty');
      } else {
        await this._processPotentialMatchesForUnmatchedUsers(
          unmatchedUserIds,
          profiles
        );
      }

      // Update priority flag for unmatched users
      await this._updatePriorityForUnmatchedUsers(unmatchedUserIds, matchedUserIds);

      console.info(
        `${BatchMatchingService.TAG}: Matching process completed. Matched: ${matchedUserIds.size}, Unmatched: ${unmatchedUserIds.length}`
      );

      // if (!kTestMode) {
        await updateDoc(
          doc(db, "appConfig", "settings"),
          { matchingAlgorithmBegin: false }
        );
      // }
    } catch (e) {
      console.error(
        `${BatchMatchingService.TAG}: Error in processAllUsersMatching:`,
        e
      );
      throw e;
    }
  }

  private async _processPotentialMatchesForUnmatchedUsers(
    unmatchedUserIds: string[],
    allProfiles: FirestoreUser[]
  ): Promise<void> {
    try {
      console.info(
        `${BatchMatchingService.TAG}: Processing potential matches for ${unmatchedUserIds.length} unmatched users`
      );

      if (unmatchedUserIds.length === 0) {
        console.info(
          `${BatchMatchingService.TAG}: No unmatched users to process potential matches for`
        );
        return;
      }

      for (const unmatchedUserId of unmatchedUserIds) {
        // Find the unmatched user's profile
        const unmatchedUser = allProfiles.find(
          (profile) => profile.id === unmatchedUserId
        );

        if (!unmatchedUser) continue;

        // Calculate potential matches against ALL users (including matched ones)
        const potentialMatches = await this._findPotentialMatchesForUser(
          unmatchedUser,
          allProfiles
        );

        if (potentialMatches.length > 0) {
          // Store potential matches in separate collection
          await this._storePotentialMatchesInCollection(
            unmatchedUserId,
            potentialMatches
          );
          console.info(
            `${BatchMatchingService.TAG}: Stored ${potentialMatches.length} potential matches for user: ${unmatchedUserId}`
          );
        } else {
          console.info(
            `${BatchMatchingService.TAG}: No potential matches found for user: ${unmatchedUserId}`
          );
        }
      }

      console.info(
        `${BatchMatchingService.TAG}: Successfully processed potential matches for all unmatched users`
      );
    } catch (e) {
      console.error(
        `${BatchMatchingService.TAG}: Error processing potential matches:`,
        e
      );
    }
  }

  private async _storePotentialMatchesInCollection(
    userId: string,
    potentialMatches: Array<{ userId: string; matchScore: number; calculatedAt: FieldValue }>
  ): Promise<void> {
    try {
      // Create a batch for storing potential matches
      const batch = writeBatch(db);
      let batchCount = 0;
      const MAX_BATCH_SIZE = 450; // Safe batch size limit

      // Clear existing potential matches for this user first
      const potentialMatchesRef = collection(db, "users", userId, "potentialMatches");
      const existingMatchesSnapshot = await getDocs(potentialMatchesRef);

      // Delete existing potential matches
      for (const doc of existingMatchesSnapshot.docs) {
        batch.delete(doc.ref);
        batchCount++;

        if (batchCount >= MAX_BATCH_SIZE) {
          await batch.commit();
          console.info(
            `${BatchMatchingService.TAG}: Committed batch delete of ${batchCount} existing potential matches`
          );
          batchCount = 0;
        }
      }

      // Add new potential matches
      for (const potentialMatch of potentialMatches) {
        const matchRef = doc(
          db,
          "users",
          userId,
          "potentialMatches",
          potentialMatch.userId
        );

        batch.set(matchRef, potentialMatch);
        batchCount++;

        if (batchCount >= MAX_BATCH_SIZE) {
          await batch.commit();
          console.info(
            `${BatchMatchingService.TAG}: Committed batch of ${batchCount} potential matches`
          );
          batchCount = 0;
        }
      }

      // Update user document with potential matches metadata
      const userRef = doc(db, "users", userId);
      batch.update(userRef, {
        potentialMatchesCount: potentialMatches.length,
        potentialMatchesLastUpdated: serverTimestamp(),
      });
      batchCount++;

      // Commit any remaining operations
      if (batchCount > 0) {
        await batch.commit();
        console.info(
          `${BatchMatchingService.TAG}: Committed final batch of ${batchCount} operations for user: ${userId}`
        );
      }

      console.info(
        `${BatchMatchingService.TAG}: Successfully stored ${potentialMatches.length} potential matches for user: ${userId}`
      );
    } catch (e) {
      console.error(
        `${BatchMatchingService.TAG}: Error storing potential matches for user ${userId}:`,
        e
      );
      throw new Error(`Failed to store potential matches: ${e}`);
    }
  }

  private async _findPotentialMatchesForUser(
    unmatchedUser: FirestoreUser,
    allProfiles: FirestoreUser[]
  ): Promise<Array<{ userId: string; matchScore: number; calculatedAt: FieldValue }>> {
    const potentialMatches: Array<{
      userId: string;
      matchScore: number;
      calculatedAt: FieldValue;
    }> = [];

    try {
      for (const candidateProfile of allProfiles) {
        // Skip self
        if (candidateProfile.id === unmatchedUser.id) continue;

        // Skip if basic compatibility criteria not met
        if (!this._meetsBasicCriteria(unmatchedUser, candidateProfile)) continue;

        // Calculate AI match score
        const matchScore = await this.matchingService.getMatchScoreWithAI(
          unmatchedUser,
          candidateProfile
        );

        // Check if score falls within potential match range
        if (
          matchScore >= BatchMatchingService.POTENTIAL_MATCH_MIN_THRESHOLD &&
          matchScore <= BatchMatchingService.POTENTIAL_MATCH_MAX_THRESHOLD
        ) {
          potentialMatches.push({
            userId: candidateProfile.id!,
            matchScore: matchScore,
            calculatedAt: serverTimestamp(),
          });

          console.info(
            `${BatchMatchingService.TAG}: Found potential match: ${candidateProfile.id} with score: ${matchScore}`
          );
        }
      }

      // Sort potential matches by score (descending)
      potentialMatches.sort((a, b) => b.matchScore - a.matchScore);

      // Limit to top 10-15 potential matches to avoid document size limits
      if (potentialMatches.length > 15) {
        const limited = potentialMatches.slice(0, 15);
        console.info(
          `${BatchMatchingService.TAG}: Limited potential matches to top 15 for user: ${unmatchedUser.id}`
        );
        return limited;
      }
    } catch (e) {
      console.error(
        `${BatchMatchingService.TAG}: Error finding potential matches for user ${unmatchedUser.id}:`,
        e
      );
    }

    return potentialMatches;
  }

  private _meetsBasicCriteria(user1: FirestoreUser, user2: FirestoreUser): boolean {
    try {
      // Age range check - user1's age should fit user2's preferences
      if (
        user1.age == null ||
        user2.minAge == null ||
        user2.maxAge == null
      ) {
        return false;
      }

      if (user1.age < user2.minAge || user1.age > user2.maxAge) {
        return false;
      }

      // Age range check - user2's age should fit user1's preferences
      if (
        user2.age == null ||
        user1.minAge == null ||
        user1.maxAge == null
      ) {
        return false;
      }

      if (user2.age < user1.minAge || user2.age > user1.maxAge) {
        return false;
      }

      // Gender preference check - user1 should be interested in user2's gender
      if (
        !user1.interestedIn ||
        user1.interestedIn.length === 0 ||
        !user2.gender
      ) {
        return false;
      }

      if (!user1.interestedIn.includes(user2.gender)) {
        return false;
      }

      // Gender preference check - user2 should be interested in user1's gender
      if (
        !user2.interestedIn ||
        user2.interestedIn.length === 0 ||
        !user1.gender
      ) {
        return false;
      }

      if (!user2.interestedIn.includes(user1.gender)) {
        return false;
      }

      return true;
    } catch (e) {
      console.error(`${BatchMatchingService.TAG}: Error in basic criteria check:`, e);
      return false;
    }
  }

  /**
   * Updates priority flags for users based on matching results
   */
  private async _updatePriorityForUnmatchedUsers(
    unmatchedUserIds: string[],
    matchedUserIds: Set<string>
  ): Promise<void> {
    try {
      console.info(
        `${BatchMatchingService.TAG}: Updating priority flags for ${unmatchedUserIds.length} unmatched users`
      );

      if (unmatchedUserIds.length === 0 && matchedUserIds.size === 0) {
        console.info(
          `${BatchMatchingService.TAG}: No users to update priority flags for`
        );
        return;
      }

      const batch = writeBatch(db);

      // Set prioritizeNextMatch to true for unmatched users
      for (const userId of unmatchedUserIds) {
        const userRef = doc(db, 'users', userId);
        batch.update(userRef, { prioritizeNextMatch: true });
        console.info(
          `${BatchMatchingService.TAG}: Setting priority flag for unmatched user: ${userId}`
        );
      }

      // Remove prioritizeNextMatch flag for successfully matched users
      for (const userId of matchedUserIds) {
        const userRef = doc(db, "users", userId);
        batch.update(userRef, { prioritizeNextMatch: deleteField() });
        console.info(
          `${BatchMatchingService.TAG}: Removing priority flag for matched user: ${userId}`
        );
      }

      await batch.commit();
      console.info(
        `${BatchMatchingService.TAG}: Successfully updated priority flags for all users`
      );
    } catch (e) {
      console.error(`${BatchMatchingService.TAG}: Error updating priority flags:`, e);
      // Don't throw here as this shouldn't break the main matching process
    }
  }

  private async _resetExistingMatches(): Promise<void> {
    const usersRef = collection(db, "users");

    const usersQuery = query(
      usersRef,
      where("matchExpired", "==", true),
      where("userType", "==", "test")
    );

    const usersSnapshot = await getDocs(usersQuery);

    try {
      console.info(`${BatchMatchingService.TAG}: Starting to reset existing matches`);

      if (usersSnapshot.empty) {
        console.info(`${BatchMatchingService.TAG}: No users found to reset matches for`);
        return;
      }

      const batch = writeBatch(db);
      let batchCount = 0;
      const MAX_BATCH_SIZE = 400; // Maximum number of operations in a batch

      // Reset matchedUserId and matchId for all users
      for (const userDoc of usersSnapshot.docs) {
        batch.update(doc(db, 'users', userDoc.id), {
          matchedUserId: null,
          matchId: null,
          matchExpired: false,
        });
        batchCount++;

        // Commit batch when it gets close to the limit
        if (batchCount >= MAX_BATCH_SIZE) {
          await batch.commit();
          console.info(
            `${BatchMatchingService.TAG}: Committed batch of ${batchCount} user resets`
          );
          batchCount = 0;
        }
      }

      // Commit any remaining operations
      if (batchCount > 0) {
        await batch.commit();
        console.info(
          `${BatchMatchingService.TAG}: Committed final batch of ${batchCount} user resets`
        );
      }

      console.info(
        `${BatchMatchingService.TAG}: Successfully reset matches for ${usersSnapshot.docs.length} users`
      );
    } catch (e) {
      console.error(`${BatchMatchingService.TAG}: Error resetting existing matches:`, e);
      throw e; // Re-throw as this is a critical step
    }
  }
}