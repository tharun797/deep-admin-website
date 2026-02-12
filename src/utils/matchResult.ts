// matchResult.ts

import { FirestoreUser } from "../types";

export class MatchResult {

  profile: FirestoreUser;
  score: number;
  commonInterests: string[];

  constructor(
    profile: FirestoreUser,
    score: number,
    commonInterests: string[]
  ) {
    this.profile = profile;
    this.score = score;
    this.commonInterests = commonInterests;
  }

  toString(): string {
    return `MatchResult(profile: ${this.profile.id}, score: ${this.score}, commonInterests: [${this.commonInterests.join(", ")}])`;
  }
}
