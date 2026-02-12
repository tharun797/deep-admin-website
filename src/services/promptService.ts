// promptService.ts

import {
  doc,
  getDoc
} from "firebase/firestore";

import { db } from "../firebase";
import { FirestoreUser, UserPromptStatus } from "../types";

export class PromptService {
  private static readonly TAG = "PromptService";

  /**
   * Fetch prompt questions from Firestore
   */
  async fetchPromptQuestions(
    promptStatuses: UserPromptStatus[]
  ): Promise<Record<string, string>> {

    const results: Record<string, string> = {};

    try {
      const promptIds = new Set<string>();

      for (const status of promptStatuses) {
        if (status.promptId) {
          promptIds.add(status.promptId);
        }
      }

      console.info(
        `${PromptService.TAG}: Fetching ${promptIds.size} prompts`
      );

      for (const promptId of promptIds) {
        try {
          const promptRef = doc(db, "prompts", promptId);
          const promptSnap = await getDoc(promptRef);

          if (promptSnap.exists()) {
            const data = promptSnap.data();

            results[promptId] =
              (data.text as string) ?? "Unknown prompt";

            console.info(
              `${PromptService.TAG}: Fetched prompt ${promptId}`
            );
          } else {
            console.warn(
              `${PromptService.TAG}: Prompt ${promptId} does not exist`
            );
          }

        } catch (error) {
          console.error(
            `${PromptService.TAG}: Error fetching prompt ${promptId}`,
            error
          );
        }
      }

      console.info(
        `${PromptService.TAG}: Successfully fetched ${Object.keys(results).length} prompts`
      );

      return results;

    } catch (error) {
      console.error(
        `${PromptService.TAG}: Error in fetchPromptQuestions`,
        error
      );

      return {};
    }
  }

  /**
   * Find common interests between two users
   */
  async findCommonInterests(
    user1: FirestoreUser,
    user2: FirestoreUser
  ): Promise<string[]> {

    try {
      console.info(
        `${PromptService.TAG}: Finding interests between ${user1.id} and ${user2.id}`
      );

      const interests = new Set<string>();

      if (
        !user1.answeredPrompts?.length ||
        !user2.answeredPrompts?.length
      ) {
        console.info(
          `${PromptService.TAG}: Insufficient prompt data`
        );

        return [];
      }

      for (const prompt1 of user1.answeredPrompts) {

        if (!prompt1.answer) continue;

        for (const prompt2 of user2.answeredPrompts) {

          if (!prompt2.answer) continue;

          const words1 = prompt1.answer
            .toLowerCase()
            .split(" ")
            .filter(word => word.length > 3);

          const words2 = prompt2.answer
            .toLowerCase()
            .split(" ");

          for (const word of words1) {

            if (words2.includes(word)) {

              interests.add(word);

              console.info(
                `${PromptService.TAG}: Found common interest "${word}"`
              );
            }
          }
        }
      }

      // Remove meaningless words
      const commonWords = new Set([
        "this", "that", "with", "when", "what",
        "have", "like", "love", "would", "about",
        "there", "their", "they", "because",
        "could", "should", "really", "things",
        "thing", "something", "anything",
        "everything", "nothing", "myself",
        "yourself", "himself", "herself"
      ]);

      for (const word of commonWords) {
        interests.delete(word);
      }

      console.info(
        `${PromptService.TAG}: Found ${interests.size} common interests`
      );

      return Array.from(interests);

    } catch (error) {

      console.error(
        `${PromptService.TAG}: Error finding common interests`,
        error
      );

      return [];
    }
  }

  /**
   * Format prompts for AI input
   */
  getFormattedUserPrompts(
    user: FirestoreUser,
    promptQuestions: Record<string, string>
  ): string {

    let userPrompts = "";

    if (!user.answeredPrompts?.length) {
      return userPrompts;
    }

    for (const promptStatus of user.answeredPrompts) {

      if (!promptStatus.answer) continue;

      const question =
        promptQuestions[promptStatus.promptId] ??
        "Unknown prompt";

      userPrompts +=
        `Question: "${question}", Answer: "${promptStatus.answer}"\n`;
    }

    return userPrompts;
  }
}
