// generateMatchPrompt.ts

import { FirestoreUser } from "../types";

export class GenerateMatchPrompt {

  static generateMatchPrompt(
    profile1: FirestoreUser,
    profile2: FirestoreUser,
    promptQuestions: Record<string, string>,
    tag: string
  ): string {

    try {

      console.info(
        `${tag}: Generating AI prompt for ${profile1.id} and ${profile2.id}`
      );

      // Build profile1 prompts string
      let profile1Prompts = "";

      if (profile1.answeredPrompts?.length) {

        for (const promptStatus of profile1.answeredPrompts) {

          const question =
            promptQuestions[promptStatus.promptId] ??
            "Unknown prompt";

          const answer =
            promptStatus.answer ??
            "No answer provided";

          profile1Prompts +=
            `Question: "${question}", Answer: "${answer}"\n`;
        }
      }

      // Build profile2 prompts string
      let profile2Prompts = "";

      if (profile2.answeredPrompts?.length) {

        for (const promptStatus of profile2.answeredPrompts) {

          const question =
            promptQuestions[promptStatus.promptId] ??
            "Unknown prompt";

          const answer =
            promptStatus.answer ??
            "No answer provided";

          profile2Prompts +=
            `Question: "${question}", Answer: "${answer}"\n`;
        }
      }

      const prompt = `
Profile 1: {

  Age: ${profile1.age ?? "Unknown"},
  Gender: ${profile1.gender ?? "Unknown"},
  Sexuality: ${profile1.sexuality ?? "Unknown"},
  Interested In: ${profile1.interestedIn?.join(", ") ?? "Unknown"},

  Prompt Responses:
  ${profile1Prompts}
}

Profile 2: {

  Age: ${profile2.age ?? "Unknown"},
  Gender: ${profile2.gender ?? "Unknown"},
  Sexuality: ${profile2.sexuality ?? "Unknown"},
  Interested In: ${profile2.interestedIn?.join(", ") ?? "Unknown"},

  Prompt Responses:
  ${profile2Prompts}
}

Analyze these profiles for compatibility considering:

1. Gender and sexuality compatibility
2. Age preferences compatibility
3. Personality match based on prompt responses
4. Communication style and values alignment
5. Potential for meaningful connection

Return a compatibility score between 0 and 1, where:

0 = Not compatible at all
1 = Highly compatible

Format your response exactly as:

Match Score: [score]
`;

      console.info(
        `${tag}: AI prompt generated successfully (${prompt.length} chars)`
      );

      return prompt;

    } catch (error) {

      console.error(
        `${tag}: Error generating AI prompt`,
        error
      );

      throw new Error(
        `Failed to generate AI prompt: ${error}`
      );
    }
  }
}
