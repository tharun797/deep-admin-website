import { ImageState } from "../types";

export class GenerateRankingPrompt {
  static generateRankingPrompt(_userId: string, images: ImageState[]): string {
    const imageCount = images.length;
    const prompt = `
You are analyzing dating profile photos for effectiveness and ranking them from best to worst.
User has ${imageCount} photo(s).

Your task is to rank these photos in order of effectiveness for a dating profile (best to worst).

Ranking Criteria:
1) Photo Quality
- High resolution, sharp, well-lit
- Face clearly visible
- No excessive filters or blurriness
- Natural camera angles

2) Facial Visibility & Expression
- Face clearly visible
- Natural, genuine expression
- Eyes visible and engaging
- Positive energy/warmth

3) Profile Optimization Value
- How much it contributes to an effective dating profile
- Variety in composition (headshot, full-body, lifestyle, etc.)
- How well it represents the user authentically
- Social/lifestyle signals (if present)

4) Swipe-Worthiness
- First impression impact
- Likelihood to generate matches
- Authenticity and relatability

IMPORTANT:
- Rank ALL images, even if some are low quality
- If there are fewer than 6 images, rank only the images provided
- Rank based on dating profile effectiveness, NOT beauty standards
- Consider the context of having multiple photos (variety matters)

Return EXACTLY this JSON format:
{
  "rankings": [
    {
      "rank": 1,
      "imageIndex": <0-based index of image>,
      "score": <number 1-100>,
      "reason": "<concise reason why this is the best photo>"
    },
    {
      "rank": 2,
      "imageIndex": <0-based index of image>,
      "score": <number 1-100>,
      "reason": "<concise reason>"
    },
    ...continue for all images...
  ],
  "summary": "<brief overall assessment of the photo set and suggestions for improvement>",
  "bestPhotoAdvice": "<specific advice about which photo should be the profile picture>"
}

Return ONLY the JSON object. No markdown. No extra text.
`;
    return prompt;
  }
}

export default GenerateRankingPrompt;