import { NotificationService } from '../services/notificationService';
import { CompatibilityService } from '../services/compatibilityService';
import { GoogleAiService } from '../services/googleAiService';
// import { OpenAIService } from './openAIService';
import { PromptService } from '../services/promptService';
import { GenerateMatchPrompt } from '../utils/generateMatchPrompt';
import { MatchResult } from '../utils/matchResult';
import { ProfileDatabase } from '../db/profileDatabase';
import { FirestoreUser } from "../types";
import { db } from "../firebase";
import {
    Firestore, getFirestore,
  collection,
  doc, 
  writeBatch,
 increment,
 
} from "firebase/firestore";


export class MatchingService {
  private static readonly TAG = 'MatchingService';

  private firestore: Firestore;
  // private openAIService: OpenAIService;
  private googleAIService: GoogleAiService;
  private compatibilityService: CompatibilityService;
  private promptService: PromptService;
  private profileDatabase: ProfileDatabase;

  constructor(
    firestore?: Firestore,
    // openAIService?: OpenAIService,
    compatibilityService?: CompatibilityService,
    promptService?: PromptService
  ) {
    this.firestore = firestore ?? getFirestore();
    this.googleAIService = new GoogleAiService();
    // this.openAIService = openAIService ?? new OpenAIService();
    this.compatibilityService = compatibilityService ?? new CompatibilityService();
    this.promptService = promptService ?? new PromptService();
    this.profileDatabase = new ProfileDatabase();
  }

  /**
   * AI-enhanced matching score calculation
   */
  async getMatchScoreWithAI(
    currentUser: FirestoreUser,
    potentialMatch: FirestoreUser
  ): Promise<number> {
    try {
      console.info(
        `${MatchingService.TAG}: Calculating AI-enhanced match score between ${currentUser.id} and ${potentialMatch.id}`
      );

      const basicScore = this.compatibilityService.calculateBasicCompatibility(
        currentUser,
        potentialMatch
      );

      // If basic compatibility is too low, return early
      if (basicScore < 0.3) {
        console.info(
          `${MatchingService.TAG}: Basic compatibility score (${basicScore}) is below threshold (0.3), skipping AI assessment`
        );
        return basicScore;
      }

      console.info(
        `${MatchingService.TAG}: Basic compatibility score: ${basicScore} - proceeding with AI assessment`
      );

      try {
        // Get prompt questions for AI matching
        const promptQuestions = await this.promptService.fetchPromptQuestions([
          ...(currentUser.answeredPrompts ?? []),
          ...(potentialMatch.answeredPrompts ?? []),
        ]);

        // Generate AI prompt and get response
        const aiPrompt = GenerateMatchPrompt.generateMatchPrompt(
          currentUser,
          potentialMatch,
          promptQuestions,
          MatchingService.TAG
        );

        // const aiScore = await this.openAIService.getAIMatchScore(aiPrompt);
        const aiScore = await this.googleAIService.getAIMatchScore(aiPrompt);
        console.info(`${MatchingService.TAG}: AI match score: ${aiScore}`);

        // Weighted combination of scores
        let finalScore = basicScore * 0.4 + aiScore * 0.6;
        console.info(
          `${MatchingService.TAG}: Combined match score: ${finalScore} (40% basic + 60% AI)`
        );

        console.debug(
          `history count for ${currentUser.id} is ${currentUser.history?.length ?? 0}`
        );

        if (currentUser.history?.includes(potentialMatch.id!)) {
          const originalScore = finalScore;
          finalScore = finalScore * 0.8; // Apply 20% penalty for history matches
          console.info(
            `${MatchingService.TAG}: Applied history penalty: ${originalScore} -> ${finalScore}`
          );
        }

        return finalScore;
      } catch (apiError) {
        // Fall back to basic score if AI fails
        console.error(`${MatchingService.TAG}: AI matching failed:`, apiError);
        console.info(
          `${MatchingService.TAG}: Falling back to basic compatibility score: ${basicScore}`
        );
        return basicScore;
      }
    } catch (e) {
      console.error(`${MatchingService.TAG}: Error in getMatchScoreWithAI:`, e);
      return 0.0; // Return default value on error
    }
  }

  /**
   * Find the best match for a given user
   * @param currentUser - The user to find a match for
   * @param candidateProfiles - Optional array of candidate profiles to search through.
   *                           If provided, uses these profiles; otherwise falls back to database query
   */
  async findBestMatchForUser(
    currentUser: FirestoreUser,
    candidateProfiles?: FirestoreUser[]
  ): Promise<string> {
    try {
      // Validate user profile
      this._validateUserProfile(currentUser);

      // Find potential matches that meet basic criteria
      const potentialMatches = await this._findPotentialMatches(
        currentUser,
        candidateProfiles
      );

      if (potentialMatches.length === 0) {
        console.info(
          `${MatchingService.TAG}: No viable potential matches found for user ${currentUser.id}`
        );
        return '';
      }

      // Calculate match scores for all potential matches
      const matches = await this._calculateMatchScores(
        currentUser,
        potentialMatches
      );

      // Sort matches by score in descending order
      matches.sort((a, b) => b.score - a.score);
      console.info(`${MatchingService.TAG}: Sorted ${matches.length} matches by score`);

      // Return the best match (if any matches were found with score >= 0.6)
      if (matches.length > 0) {
        return await this._handleBestMatch(
          currentUser.id!,
          currentUser.fcmToken ?? '',
          matches
        );
      } else {
        console.info(`${MatchingService.TAG}: No matches found after filtering`);
        return '';
      }
    } catch (e) {
      console.error(`${MatchingService.TAG}: Error in findBestMatchForUser:`, e);
      return '';
    }
  }

  /**
   * Validate that the user profile has all required fields
   */
  private _validateUserProfile(profile: FirestoreUser): void {
    if (!profile.id) {
      throw new Error('User profile is incomplete: missing id');
    }

    if (!profile.gender) {
      throw new Error('User profile is incomplete: missing gender');
    }

    if (!profile.interestedIn || profile.interestedIn.length === 0) {
      throw new Error('User profile is incomplete: missing gender preferences');
    }

    if (
      profile.age == null ||
      profile.minAge == null ||
      profile.maxAge == null
    ) {
      throw new Error(
        'User profile is incomplete: missing age or age preferences'
      );
    }

    console.info(`${MatchingService.TAG}: User profile validated successfully`);
  }

  /**
   * Find potential matches from provided candidates or local database
   * @param currentUser - The user to find matches for
   * @param candidateProfiles - Optional array of profiles to filter through
   */
  private async _findPotentialMatches(
    currentUser: FirestoreUser,
    candidateProfiles?: FirestoreUser[]
  ): Promise<FirestoreUser[]> {
    try {
      console.info(
        `${MatchingService.TAG}: Finding potential matches for user ${currentUser.id}`
      );

      // If candidate profiles are provided, use in-memory filtering
      if (candidateProfiles && candidateProfiles.length > 0) {
        console.info(
          `${MatchingService.TAG}: Using provided candidate profiles (${candidateProfiles.length} profiles)`
        );
        
        const potentialMatches = this.profileDatabase.findPotentialMatches(
          currentUser,
          candidateProfiles
        );

        console.info(
          `${MatchingService.TAG}: Found ${potentialMatches.length} potential matches from candidates`
        );
        
        return potentialMatches;
      }

      // Fallback: This shouldn't be used in batch matching, but kept for compatibility
      console.warn(
        `${MatchingService.TAG}: No candidate profiles provided - this shouldn't happen in batch matching`
      );
      return [];
    } catch (e) {
      console.error(`${MatchingService.TAG}: Error finding potential matches:`, e);
      throw new Error(`Error finding potential matches: ${e}`);
    }
  }

  /**
   * Calculate match scores for all potential matches
   */
  private async _calculateMatchScores(
    currentUser: FirestoreUser,
    potentialMatches: FirestoreUser[]
  ): Promise<MatchResult[]> {
    const matches: MatchResult[] = [];

    for (const profile of potentialMatches) {
      try {
        console.info(
          `${MatchingService.TAG}: Calculating match score for ${profile.id}`
        );

        // Get match score
        const matchScore = await this.getMatchScoreWithAI(currentUser, profile);
        console.info(
          `${MatchingService.TAG}: Match score for ${profile.id}: ${matchScore}`
        );

        // Find common interests from prompt answers
        const commonInterests = await this.promptService.findCommonInterests(
          currentUser,
          profile
        );
        console.info(
          `${MatchingService.TAG}: Found ${commonInterests.length} common interests with ${profile.id}`
        );

        matches.push({
          profile,
          score: matchScore,
          commonInterests,
        });
      } catch (e) {
        console.error(
          `${MatchingService.TAG}: Error calculating match score for ${profile.id}:`,
          e
        );
        // Continue with other matches
      }
    }

    return matches;
  }

  /**
   * Handle best match selection and update user document
   */
  private async _handleBestMatch(
    id: string,
    fcmToken: string,
    matches: MatchResult[]
  ): Promise<string> {
    console.info(
      `${MatchingService.TAG}: Best match: ${matches[0].profile.id} with score ${matches[0].score}`
    );

    const batch = writeBatch(this.firestore);

    if (matches[0].score >= 0.6) {
      console.info(
        `${MatchingService.TAG}: Setting ${matches[0].profile.id} as current match for user ${id}`
      );

      try {
        const matchedid = matches[0].profile.id!;
        const matchedUserFcmToken = matches[0].profile.fcmToken ?? '';
        const matchDocRef = doc(collection(db, "matches"));

        // Update first user
        const userRef = doc(db, 'users', id);
        batch.update(userRef, {
          matchedid: matchedid,
          matchId: matchDocRef.id,
        });

        // Update matched user
        const matchedUserRef = doc(db, 'users', matchedid);
        batch.update(matchedUserRef, {
          matchedid: id,
          matchId: matchDocRef.id,
        });

        // Create match document
        batch.set(matchDocRef, {
          matchedAt: new Date(),
          expired: false,
          matchType: 'test',
        });

        // Add to first user's history
        const user1HistoryRef = doc(db, "users", id, "history", matchedid);

        batch.set(user1HistoryRef, {
          matchedAt: new Date(),
          count: increment(1),
        });

        // Add to matched user's history
        const user2HistoryRef = doc(db, "users", matchedid, "history", id);

        batch.set(user2HistoryRef, {
          matchedAt: new Date(),
          count: increment(1),
        });

        console.info(
          `${MatchingService.TAG}: Successfully updated matchedid for user ${id}`
        );

        // Commit batch and send notifications in parallel
        await Promise.all([
          batch.commit(),
          NotificationService.sendMatchNotification({
            token1: fcmToken,
            token2: matchedUserFcmToken,
          }),
        ]);

        return matches[0].profile.id ?? '';
      } catch (e) {
        console.error(`${MatchingService.TAG}: Failed to update matchedid:`, e);
        throw new Error(`Failed to update current match: ${e}`);
      }
    } else {
      console.info(
        `${MatchingService.TAG}: Best match score (${matches[0].score}) is below 0.6 threshold, not updating matchedid`
      );
      return '';
    }
  }
}

export default MatchingService;