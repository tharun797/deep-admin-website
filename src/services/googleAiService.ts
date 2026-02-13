// googleAiService.ts

import { GoogleGenerativeAI, GenerativeModel } from "@google/generative-ai";
import { AiServiceHelper } from "../helpers/aiServiceHelper";
import { ApiKeys } from "../constants/apiKeys"; // adjust path

export class GoogleAiService {
  private static readonly TAG = "GeminiService";

  private model: GenerativeModel;
  private aiServiceHelper: AiServiceHelper;

  constructor() {
    const genAI = new GoogleGenerativeAI(ApiKeys.geminiApiKey);

    this.model = genAI.getGenerativeModel({
  model: "gemini-3-flash-preview",
});


    this.aiServiceHelper = new AiServiceHelper();
  }

  async getAIMatchScore(promptText: string): Promise<number> {
    try {
      const result = await this.model.generateContent(promptText);

      const text = result.response.text();

      return this.aiServiceHelper.parseMatchScore(
        text,
        GoogleAiService.TAG
      );
    } catch (error) {
      console.error(
        `${GoogleAiService.TAG}: Error getting AI match score`,
        error
      );

      return 0.5;
    }
  }
}
