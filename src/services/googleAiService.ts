import { GoogleGenerativeAI, GenerativeModel, Part } from "@google/generative-ai";
import { AiServiceHelper } from "../helpers/aiServiceHelper";
import { ApiKeys } from "../constants/apiKeys";
import { ImageState } from "../types";

export interface GradingResult {
  score: number;
  tier: 'A' | 'B' | 'C' | 'D';
  reason: string;
  strength: string;
  improvement: string;
}

export interface PhotoRanking {
  rank: number;
  imageIndex: number;
  score: number;
  reason: string;
}

export interface RankingResult {
  rankings: PhotoRanking[];
  summary: string;
  bestPhotoAdvice: string;
}

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
      return this.aiServiceHelper.parseMatchScore(text, GoogleAiService.TAG);
    } catch (error) {
      console.error(`${GoogleAiService.TAG}: Error getting AI match score`, error);
      return 0.5;
    }
  }

  /**
   * Grade a user's profile photos using Gemini Vision
   * @param images - Array of ImageState from the user's images subcollection
   * @param promptText - The grading prompt from GenerateGradingPrompt
   * @returns GradingResult with score, tier, and reason
   */
  async gradeUserPhotos(images: ImageState[], promptText: string): Promise<GradingResult | null> {
    try {
      if (!images || images.length === 0) {
        console.warn(`${GoogleAiService.TAG}: No images provided for grading`);
        return null;
      }

      // Build parts array - start with text prompt
      const parts: Part[] = [{ text: promptText }];

      // Add each image using fileData (avoids CORS - Gemini fetches directly from URL)
      for (const image of images) {
        const imagePath = image.imagePath;
        if (!imagePath || !imagePath.startsWith('http')) continue;

        parts.push({
          fileData: {
            mimeType: 'image/jpeg',
            fileUri: imagePath,
          }
        } as Part);
      }

      // Need at least the text + one image
      if (parts.length < 2) {
        console.warn(`${GoogleAiService.TAG}: No valid images could be loaded`);
        return null;
      }

      const result = await this.model.generateContent(parts);
      const text = result.response.text().trim();

      // Parse the JSON response
      const clean = text.replace(/```json|```/g, '').trim();
      const parsed = JSON.parse(clean);

      const tier = parsed.tier as 'A' | 'B' | 'C' | 'D';
      if (!['A', 'B', 'C', 'D'].includes(tier)) {
        throw new Error(`Invalid tier: ${tier}`);
      }

      return {
        score: Number(parsed.score) || 0,
        tier,
        reason: parsed.reason || '',
        strength: parsed.strength || '',
        improvement: parsed.improvement || '',
      };
    } catch (error) {
      console.error(`${GoogleAiService.TAG}: Error grading user photos`, error);
      return null;
    }
  }

  /**
   * Rank a user's profile photos from best to worst using Gemini Vision
   * @param images - Array of ImageState from the user's images subcollection
   * @param promptText - The ranking prompt from GenerateRankingPrompt
   * @returns RankingResult with rankings and advice
   */
  async rankUserPhotos(images: ImageState[], promptText: string): Promise<RankingResult | null> {
    try {
      if (!images || images.length === 0) {
        console.warn(`${GoogleAiService.TAG}: No images provided for ranking`);
        return null;
      }

      // Build parts array - start with text prompt
      const parts: Part[] = [{ text: promptText }];

      // Add each image using fileData (avoids CORS - Gemini fetches directly from URL)
      for (const image of images) {
        const imagePath = image.imagePath;
        if (!imagePath || !imagePath.startsWith('http')) continue;

        parts.push({
          fileData: {
            mimeType: 'image/jpeg',
            fileUri: imagePath,
          }
        } as Part);
      }

      // Need at least the text + one image
      if (parts.length < 2) {
        console.warn(`${GoogleAiService.TAG}: No valid images could be loaded`);
        return null;
      }

      const result = await this.model.generateContent(parts);
      const text = result.response.text().trim();

      // Parse the JSON response
      const clean = text.replace(/```json|```/g, '').trim();
      const parsed = JSON.parse(clean);

      return {
        rankings: parsed.rankings || [],
        summary: parsed.summary || '',
        bestPhotoAdvice: parsed.bestPhotoAdvice || '',
      };
    } catch (error) {
      console.error(`${GoogleAiService.TAG}: Error ranking user photos`, error);
      return null;
    }
  }
}