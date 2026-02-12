import { FirestoreUser } from '../types';

export class ProfileDatabase {
  private static readonly TAG = 'ProfileDatabase';

  /**
   * Find potential matches for a user from an in-memory array of profiles
   */
  findPotentialMatches(
    currentUser: FirestoreUser,
    allProfiles: FirestoreUser[]
  ): FirestoreUser[] {
    try {
      console.debug(
        `${ProfileDatabase.TAG}: Finding potential matches for user ${currentUser.id}`
      );

      const potentialMatches: FirestoreUser[] = [];

      console.debug(
        `${ProfileDatabase.TAG}: Checking ${allProfiles.length} total profiles`
      );

      for (const otherUser of allProfiles) {
        try {
          // Skip current user
          if (otherUser.id === currentUser.id) {
            continue;
          }

          // Filter by gender preferences
          if (
            currentUser.interestedIn &&
            currentUser.interestedIn.length > 0
          ) {
            if (!otherUser.gender) continue;
            if (!currentUser.interestedIn.includes(otherUser.gender)) {
              continue;
            }
          }

          // Filter by age range that current user prefers
          if (currentUser.minAge != null && otherUser.age != null) {
            if (otherUser.age < currentUser.minAge) continue;
          }

          if (currentUser.maxAge != null && otherUser.age != null) {
            if (otherUser.age > currentUser.maxAge) continue;
          }

          // Check full compatibility
          if (!this._isUserCompatible(currentUser, otherUser)) {
            console.debug(
              `${ProfileDatabase.TAG}: User ${otherUser.id} is not compatible with ${currentUser.id}`
            );
            continue;
          }

          console.debug(
            `${ProfileDatabase.TAG}: User ${otherUser.id} is compatible with ${currentUser.id}`
          );

          potentialMatches.push(otherUser);
        } catch (e) {
          console.debug(
            `${ProfileDatabase.TAG}: Error processing profile for user ${otherUser.id}:`,
            e
          );
          continue;
        }
      }

      console.debug(
        `potential matches for user ${currentUser.id} is ${potentialMatches.length}`
      );

      return potentialMatches;
    } catch (e) {
      console.debug(`${ProfileDatabase.TAG}: Error finding potential matches:`, e);
      return [];
    }
  }

  /**
   * Check if two users are compatible based on mutual preferences
   */
  private _isUserCompatible(
    currentUser: FirestoreUser,
    otherUser: FirestoreUser
  ): boolean {
    try {
      console.debug(
        `${ProfileDatabase.TAG}: Current user gender: ${currentUser.gender}, other user gender ${otherUser.gender}`
      );

      console.debug(
        `${ProfileDatabase.TAG}: Raw interestedIn value: ${otherUser.interestedIn} ${currentUser.gender}`
      );

      const interestedIn = otherUser.interestedIn;

      if (interestedIn == null) {
        console.debug(`${ProfileDatabase.TAG}: interestedIn is null, returning false`);
        return false;
      }

      if (interestedIn.length === 0) {
        console.debug(`${ProfileDatabase.TAG}: interestedIn is empty, returning false`);
        return false;
      }

      if (!interestedIn.includes(currentUser.gender!)) {
        console.debug(
          `${ProfileDatabase.TAG}: User not interested in current user's gender (${currentUser.gender}), returning false`
        );
        return false;
      }

      console.debug(
        `${ProfileDatabase.TAG}: User is interested in current user's gender (${currentUser.gender})`
      );

      // Check if current user's age is within other user's preferred range
      console.debug(
        `${ProfileDatabase.TAG}: Current user age: ${currentUser.age}, other user minAge: ${otherUser.minAge}, other user maxAge: ${otherUser.maxAge}`
      );

      const otherMinAge = otherUser.minAge;
      const otherMaxAge = otherUser.maxAge;

      if (
        otherMinAge != null &&
        otherMaxAge != null &&
        currentUser.age != null
      ) {
        if (currentUser.age < otherMinAge) {
          console.debug(
            `${ProfileDatabase.TAG}: Current user age (${currentUser.age}) is less than min age preference (${otherMinAge}), returning false`
          );
          return false;
        }

        if (currentUser.age > otherMaxAge) {
          console.debug(
            `${ProfileDatabase.TAG}: Current user age (${currentUser.age}) is greater than max age preference (${otherMaxAge}), returning false`
          );
          return false;
        }

        console.debug(
          `${ProfileDatabase.TAG}: Current user age (${currentUser.age}) is within range ${otherMinAge}-${otherMaxAge}`
        );
      } else {
        console.debug(
          `${ProfileDatabase.TAG}: Age preference check skipped due to null values`
        );
      }

      return true;
    } catch (e) {
      console.debug(`${ProfileDatabase.TAG}: Error in compatibility check:`, e);
      return false;
    }
  }

  /**
   * Get all profiles except the specified user
   */
  getAllProfilesExcept(
    currentUserId: string,
    allProfiles: FirestoreUser[]
  ): FirestoreUser[] {
    return allProfiles.filter((profile) => profile.id !== currentUserId);
  }
}

export default ProfileDatabase;