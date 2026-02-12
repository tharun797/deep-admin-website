// compatibilityService.ts

import { FirestoreUser } from "../types";

export class CompatibilityService {
  private static readonly TAG = "CompatibilityService";

  /**
   * Calculate basic compatibility score without AI
   */
  calculateBasicCompatibility(
    currentUser: FirestoreUser,
    potentialMatch: FirestoreUser
  ): number {
    try {
      console.info(
        `${CompatibilityService.TAG}: Calculating compatibility between ${currentUser.id} and ${potentialMatch.id}`
      );

      let score = 0;
      let totalFactors = 0;

      // -------------------------
      // Deal breaker: Gender preference
      // -------------------------

      if (!currentUser.interestedIn || !potentialMatch.gender) {
        console.warn(`${CompatibilityService.TAG}: Missing gender preference`);
        return 0;
      }

      const currentUserInterested =
        currentUser.interestedIn.includes(potentialMatch.gender);

      if (!potentialMatch.interestedIn || !currentUser.gender) {
        console.warn(`${CompatibilityService.TAG}: Missing gender data`);
        return 0;
      }

      const matchInterested =
        potentialMatch.interestedIn.includes(currentUser.gender);

      if (!currentUserInterested || !matchInterested) {
        console.info(
          `${CompatibilityService.TAG}: Gender mismatch`
        );
        return 0;
      }

      // -------------------------
      // Age compatibility (current user's preference)
      // -------------------------

      if (
        currentUser.minAge != null &&
        currentUser.maxAge != null &&
        potentialMatch.age != null
      ) {
        if (
          potentialMatch.age >= currentUser.minAge &&
          potentialMatch.age <= currentUser.maxAge
        ) {
          score += 1;
        }
      } else {
        console.warn(`${CompatibilityService.TAG}: Missing age data`);
      }

      totalFactors++;

      // -------------------------
      // Age compatibility (match's preference)
      // -------------------------

      if (
        potentialMatch.minAge != null &&
        potentialMatch.maxAge != null &&
        currentUser.age != null
      ) {
        if (
          currentUser.age >= potentialMatch.minAge &&
          currentUser.age <= potentialMatch.maxAge
        ) {
          score += 1;
        }
      } else {
        console.warn(`${CompatibilityService.TAG}: Missing age preference`);
      }

      totalFactors++;

      // -------------------------
      // Prompt compatibility
      // -------------------------

      if (
        currentUser.answeredPrompts?.length &&
        potentialMatch.answeredPrompts?.length
      ) {
        let promptScore = 0;
        let promptComparisons = 0;

        for (const userPrompt of currentUser.answeredPrompts) {
          for (const matchPrompt of potentialMatch.answeredPrompts) {
            if (userPrompt.promptId === matchPrompt.promptId) {
              if (!userPrompt.answer || !matchPrompt.answer) continue;

              const userWords = userPrompt.answer
                .toLowerCase()
                .split(" ")
                .filter(word => word.length > 3);

              const matchAnswer = matchPrompt.answer.toLowerCase();

              const commonWords = userWords.filter(word =>
                matchAnswer.includes(word)
              ).length;

              if (userWords.length > 0) {
                const similarityScore = commonWords / userWords.length;
                promptScore += similarityScore;
                promptComparisons++;
              }
            }
          }
        }

        if (promptComparisons > 0) {
          const avgPromptScore = promptScore / promptComparisons;
          score += avgPromptScore;
          totalFactors++;
        }
      }

      // -------------------------
      // Sexuality compatibility
      // -------------------------

      if (currentUser.sexuality && potentialMatch.sexuality) {
        if (
          this.areCompatibleSexualities(
            currentUser.sexuality,
            potentialMatch.sexuality
          )
        ) {
          score += 1;
        }

        totalFactors++;
      } else {
        console.warn(`${CompatibilityService.TAG}: Missing sexuality`);
      }

      // -------------------------
      // Final score
      // -------------------------

      const finalScore = totalFactors > 0 ? score / totalFactors : 0;

      console.info(
        `${CompatibilityService.TAG}: Final compatibility score = ${finalScore}`
      );

      return finalScore;

    } catch (error) {
      console.error(
        `${CompatibilityService.TAG}: Error calculating compatibility`,
        error
      );
      return 0;
    }
  }

  /**
   * Sexuality compatibility check
   */
  areCompatibleSexualities(
    sexuality1: string,
    sexuality2: string
  ): boolean {
    try {
      if (sexuality1 === "Straight" && sexuality2 === "Straight") {
        return true;
      }

      if (
        ["Gay", "Lesbian"].includes(sexuality1) &&
        ["Gay", "Lesbian"].includes(sexuality2)
      ) {
        return true;
      }

      if (sexuality1 === "Bisexual" || sexuality2 === "Bisexual") {
        return true;
      }

      if (sexuality1 === "Pansexual" || sexuality2 === "Pansexual") {
        return true;
      }

      return false;

    } catch (error) {
      console.error(
        `${CompatibilityService.TAG}: Sexuality compatibility error`,
        error
      );

      return false;
    }
  }
}
