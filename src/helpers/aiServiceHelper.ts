// aiServiceHelper.ts

export class AiServiceHelper {
  /**
   * Parse match score from AI response
   * Expected format: "Match Score: 0.78"
   */
  parseMatchScore(aiResponse: string, tag: string): number {
    try {
      const regex = /Match Score:\s*([0-9.]+)/;
      const match = aiResponse.match(regex);

      if (match && match[1]) {
        const score = parseFloat(match[1]);

        console.info(
          `${tag}: Successfully parsed match score: ${score}`
        );

        return score;
      }

      console.warn(
        `${tag}: Could not parse match score from AI response: "${aiResponse}"`
      );

      return 0.5; // Default value if parsing fails
    } catch (error) {
      console.error(
        `${tag}: Error parsing AI match score`,
        error
      );

      return 0.5; // Default to middle score on error
    }
  }
}
