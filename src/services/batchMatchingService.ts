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
  updateDoc,
  FieldValue
} from "firebase/firestore";

import { MatchingService } from "../services/matchingService";
import { ResetMatchesService } from "./resetMatchesService";
import { MatchConfigService } from "./matchConfigService";
import { FirestoreUser, UserPromptStatus } from "../types";

export class BatchMatchingService {
  
  private matchingService: MatchingService;
  private resetMatchesService: ResetMatchesService;
  private static readonly TAG = 'EnhancedBatchMatchingService';

  static readonly POTENTIAL_MATCH_MIN_THRESHOLD = 0.5;
  static readonly POTENTIAL_MATCH_MAX_THRESHOLD = 0.59;

  constructor() {
    this.matchingService = new MatchingService();
    this.resetMatchesService = new ResetMatchesService();
  }

  async processAllUsersMatching(adminEmail: string): Promise<number> {
    let totalMatchedUsers = 0;
    const startTime = Date.now();
    
    try {
      // Mark matching as started in Firestore
      await MatchConfigService.startMatching(adminEmail);

      await this.resetMatchesService.resetAllMatches();

      console.info(
        `${BatchMatchingService.TAG}: Starting enhanced batch matching process for all users`
      );

      // Phase 1: Initializing (0-10%)
      await MatchConfigService.updateProgress({
        status: 'initializing',
      });

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
        await MatchConfigService.completeMatching(0, 0);
        return 0;
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
        .sort(() => Math.random() - 0.5);

      const priorityFreeDocs = allDocs
        .filter(
          (doc) =>
            doc.data().prioritizeNextMatch === true &&
            doc.data().isPremium !== true
        )
        .sort(() => Math.random() - 0.5);

      const remainingDocs = allDocs.filter(
        (doc) => doc.data().prioritizeNextMatch !== true
      );

      const premiumDocs = remainingDocs
        .filter((doc) => doc.data().isPremium === true)
        .sort(() => Math.random() - 0.5);

      const freeDocs = remainingDocs
        .filter((doc) => doc.data().isPremium !== true)
        .sort(() => Math.random() - 0.5);

      const users = [
        ...priorityPremiumDocs,
        ...premiumDocs,
        ...priorityFreeDocs,
        ...freeDocs,
      ];

      const totalUsersCount = users.length;

      console.info(`${BatchMatchingService.TAG}: Found ${totalUsersCount} users to process`);
      console.info(
        `${BatchMatchingService.TAG}: Priority Premium users: ${priorityPremiumDocs.length}`
      );
      console.info(`${BatchMatchingService.TAG}: Premium users: ${premiumDocs.length}`);
      console.info(
        `${BatchMatchingService.TAG}: Priority Free users: ${priorityFreeDocs.length}`
      );
      console.info(`${BatchMatchingService.TAG}: Free users: ${freeDocs.length}`);

      await MatchConfigService.updateProgress({
        status: 'initializing',
        totalUsers: totalUsersCount,
        processedUsers: 0,
      });

      // Convert Firestore docs to FirestoreUser objects
      const profiles: FirestoreUser[] = [];
      for (const userDoc of users) {
        const userId = userDoc.id;
        const userData = userDoc.data();

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

        profiles.push(
          FirestoreUser.fromMap(userData, userPrompts, userId, history)
        );
      }

      console.info(`${BatchMatchingService.TAG}: Loaded ${profiles.length} profiles into memory`);

      // Phase 2: Matching (10-70% of total progress)
      await MatchConfigService.updateProgress({
        status: 'matching',
        totalUsers: totalUsersCount,
        processedUsers: 0,
        matchedUsers: 0,
      });

      const matchedUserIds = new Set<string>();
      const unmatchedUserIds: string[] = [];
      const availableProfiles = new Set<string>(profiles.map(p => p.id!));

      // Process matching for each user
      let processedCount = 0;
      for (const profile of profiles) {
        const userId = profile.id;
        if (!userId) continue;

        if (matchedUserIds.has(userId)) {
          console.info(
            `${BatchMatchingService.TAG}: User ${userId} was already matched in this batch, skipping`
          );
          continue;
        }

        if (!availableProfiles.has(userId)) {
          console.info(
            `${BatchMatchingService.TAG}: User ${userId} was already matched, skipping`
          );
          continue;
        }

        // SET matchingAlgorithmBegin to true for THIS user
        await updateDoc(doc(db, "users", userId), {
          matchingAlgorithmBegin: true
        });

        console.info(`${BatchMatchingService.TAG}: Finding matches for user ${userId}`);

        try {
          const candidateProfiles = profiles.filter(
            p => p.id !== userId && availableProfiles.has(p.id!)
          );

          const matchedUserId = await this.matchingService.findBestMatchForUser(
            profile,
            candidateProfiles
          );

          if (matchedUserId) {
            matchedUserIds.add(userId);
            matchedUserIds.add(matchedUserId);
            availableProfiles.delete(userId);
            availableProfiles.delete(matchedUserId);

            console.info(
              `${BatchMatchingService.TAG}: Match created between ${userId} and ${matchedUserId}`
            );
          } else {
            unmatchedUserIds.push(userId);
            console.info(`${BatchMatchingService.TAG}: No match found for user ${userId}`);
          }
        } catch (e) {
          console.error(
            `${BatchMatchingService.TAG}: Error finding match for user ${userId}:`,
            e
          );
          unmatchedUserIds.push(userId);
        } finally {
          // SET matchingAlgorithmBegin to false for THIS user after matching completes
          await updateDoc(doc(db, "users", userId), {
            matchingAlgorithmBegin: false
          });
        }

        processedCount++;

        // Update progress every 5 users or at key milestones
        // Matching phase represents 60% of total (from 10% to 70%)
        if (processedCount % 5 === 0 || processedCount === totalUsersCount) {
          const elapsedTime = (Date.now() - startTime) / 1000; // in seconds
          const avgTimePerUser = elapsedTime / processedCount;
          const remainingUsers = totalUsersCount - processedCount;
          // Estimate remaining time including potential matches phase (30%)
          const matchingTimeRemaining = avgTimePerUser * remainingUsers;
          const potentialMatchesTime = (elapsedTime / processedCount) * unmatchedUserIds.length * 0.5;
          const estimatedTimeRemaining = Math.ceil(matchingTimeRemaining + potentialMatchesTime);

          await MatchConfigService.updateProgress({
            status: 'matching',
            totalUsers: totalUsersCount,
            processedUsers: processedCount,
            matchedUsers: matchedUserIds.size,
            estimatedTimeRemaining: estimatedTimeRemaining,
          });
        }
      }

      if (profiles.length === 0) {
        console.debug('Profiles are empty');
      } else {
        // Phase 3: Processing unmatched (70-90% of total progress)
        await MatchConfigService.updateProgress({
          status: 'processing_unmatched',
          totalUsers: totalUsersCount,
          processedUsers: totalUsersCount,
          matchedUsers: matchedUserIds.size,
          unmatchedUsers: unmatchedUserIds.length,
        });

        await this._processPotentialMatchesForUnmatchedUsers(
          unmatchedUserIds,
          profiles
        );
      }

      // Phase 4: Finalizing (90-100% of total progress)
      await MatchConfigService.updateProgress({
        status: 'finalizing',
        totalUsers: totalUsersCount,
        processedUsers: totalUsersCount,
        matchedUsers: matchedUserIds.size,
        unmatchedUsers: unmatchedUserIds.length,
      });

      await this._updatePriorityForUnmatchedUsers(unmatchedUserIds, matchedUserIds);

      totalMatchedUsers = matchedUserIds.size;

      console.info(
        `${BatchMatchingService.TAG}: Matching process completed. Matched: ${totalMatchedUsers}, Unmatched: ${unmatchedUserIds.length}`
      );

      // Mark matching as completed in Firestore
      await MatchConfigService.completeMatching(totalMatchedUsers, unmatchedUserIds.length);

      return totalMatchedUsers;
    } catch (e) {
      console.error(
        `${BatchMatchingService.TAG}: Error in processAllUsersMatching:`,
        e
      );
      
      // Mark matching as failed
      // await MatchConfigService.markMatchingFailed(String(e));
      
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
        const unmatchedUser = allProfiles.find(
          (profile) => profile.id === unmatchedUserId
        );

        if (!unmatchedUser) continue;

        const potentialMatches = await this._findPotentialMatchesForUser(
          unmatchedUser,
          allProfiles
        );

        if (potentialMatches.length > 0) {
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
      const batch = writeBatch(db);
      let batchCount = 0;
      const MAX_BATCH_SIZE = 450;

      const potentialMatchesRef = collection(db, "users", userId, "potentialMatches");
      const existingMatchesSnapshot = await getDocs(potentialMatchesRef);

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

      const userRef = doc(db, "users", userId);
      batch.update(userRef, {
        potentialMatchesCount: potentialMatches.length,
        potentialMatchesLastUpdated: serverTimestamp(),
      });
      batchCount++;

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
        if (candidateProfile.id === unmatchedUser.id) continue;

        if (!this._meetsBasicCriteria(unmatchedUser, candidateProfile)) continue;

        const matchScore = await this.matchingService.getMatchScoreWithAI(
          unmatchedUser,
          candidateProfile
        );

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

      potentialMatches.sort((a, b) => b.matchScore - a.matchScore);

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

      for (const userId of unmatchedUserIds) {
        const userRef = doc(db, 'users', userId);
        batch.update(userRef, { prioritizeNextMatch: true });
        console.info(
          `${BatchMatchingService.TAG}: Setting priority flag for unmatched user: ${userId}`
        );
      }

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
      const MAX_BATCH_SIZE = 400;

      for (const userDoc of usersSnapshot.docs) {
        batch.update(doc(db, 'users', userDoc.id), {
          matchedUserId: null,
          matchId: null,
          matchExpired: false,
        });
        batchCount++;

        if (batchCount >= MAX_BATCH_SIZE) {
          await batch.commit();
          console.info(
            `${BatchMatchingService.TAG}: Committed batch of ${batchCount} user resets`
          );
          batchCount = 0;
        }
      }

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
      throw e;
    }
  }
}