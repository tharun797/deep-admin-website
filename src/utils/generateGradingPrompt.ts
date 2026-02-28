import { ImageState } from "../types";

export class GenerateGradingPrompt {
  static generateGradingPrompt(_userId: string, images: ImageState[]): string {
    const imageCount = images.length;

    const prompt = `
You are analyzing dating profile photos for profile effectiveness, not beauty.

User has ${imageCount} photo(s). Maximum allowed is 6.

Your task is to objectively evaluate how optimized these photos are for attracting matches.

Score the profile out of 100 based on the following weighted categories:

1) Photo Quality (20 points)
- High resolution, not pixelated
- Good lighting (face clearly visible, no heavy shadows)
- Not blurry or out of focus
- Minimal heavy filters
- Natural camera angles (no extreme low/high distortion)

2) Facial Visibility & Expression (20 points)
- Face clearly visible in most photos (at least 4 if 6 photos)
- At least 2 photos with a natural genuine smile
- Eyes visible in most photos (not constant sunglasses)
- No majority of blank, angry, or low-energy expressions
- No excessive face obstruction

3) Variety & Composition (20 points)
- At least 1 clear close-up headshot
- At least 1 mid-shot (waist-up)
- At least 1 full-body photo
- At least 1 outdoor photo
- At least 1 lifestyle/activity photo (hobby, travel, sport, etc.)
- No excessive repetition of pose/background/outfit
- No more than 2 mirror selfies

4) Lifestyle & Social Signals (20 points)
- Optional positive signals: pet photo, social photo, activity-based image
- User must be clearly identifiable in group photos
- No confusing group-only gallery
- No visible ex-partner cropping
- Avoid excessive alcohol-focused images

5) Energy, Vibe & Authenticity (20 points)
- Confident, open body language
- Positive, lively, warm presence
- Feels natural and authentic
- Not overly edited or AI-altered
- Realistic representation of current appearance

Apply the following penalties or caps:
- No smiling photos → subtract points
- No full-body photo → subtract points
- More than 3 low-quality photos → cap score at 65
- All photos indoors → small penalty
- All photos are selfies → cap score at 70

Important Rules:
- Do NOT judge facial symmetry or genetic attractiveness.
- Focus on dating effectiveness and conversion potential.
- Be objective and consistent.
- Do not be overly generous or overly harsh.

Tier thresholds:
- A: 85–100 (Highly optimized and swipe-ready profile)
- B: 70–84 (Strong profile with minor improvements needed)
- C: 55–69 (Average profile, improvement recommended)
- D: 0–54 (Low effectiveness, major improvement needed)

Return EXACTLY this JSON format:
{
  "score": <number between 0 and 100>,
  "tier": "<A, B, C, or D>",
  "reason": "<one concise sentence explaining the biggest factor affecting the score>",
  "strength": "<one concise sentence describing the strongest positive aspect>",
  "improvement": "<one specific actionable improvement suggestion>"
}

Return ONLY the JSON object. No markdown. No extra text.
`;

    return prompt;
  }
}