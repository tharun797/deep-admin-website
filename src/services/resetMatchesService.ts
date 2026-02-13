import {
  collection,
  getDocs,
  query,
  where,
  writeBatch,
  doc,
  updateDoc,
  QueryDocumentSnapshot,
  DocumentData
} from "firebase/firestore";

import { db } from "../firebase";

export class ResetMatchesService {

  private static readonly TAG = "ResetMatchesService";

  async resetAllMatches(): Promise<void> {

    try {

      console.info(`${ResetMatchesService.TAG}: Starting reset process`);

      const usersQuery = query(
        collection(db, "users"),
        where("userType", "==", "test")
      );

      const usersSnapshot = await getDocs(usersQuery);

      if (usersSnapshot.empty) {

        console.info(`${ResetMatchesService.TAG}: No users found`);
        return;

      }

      console.info(
        `${ResetMatchesService.TAG}: Found ${usersSnapshot.docs.length} users`
      );

      await this.resetUserMatchStatus(usersSnapshot.docs);

      await this.resetMatchesCollection();

      await this.cleanupPotentialMatches(usersSnapshot.docs);

      console.info(`${ResetMatchesService.TAG}: Reset complete`);

    } catch (e) {

      console.error(`${ResetMatchesService.TAG}: Error resetting matches`, e);
      throw e;

    }

  }

  private async resetUserMatchStatus(  userDocs: QueryDocumentSnapshot<DocumentData>[]
): Promise<void> {

    console.info(
      `${ResetMatchesService.TAG}: Resetting matchExpired flag`
    );

    const MAX_BATCH = 400;
    let batch = writeBatch(db);
    let count = 0;

    for (const userDoc of userDocs) {

      batch.update(doc(db, "users", userDoc.id), {
        matchExpired: true
      });

      count++;

      if (count >= MAX_BATCH) {

        await batch.commit();

        batch = writeBatch(db);
        count = 0;

      }

    }

    if (count > 0) {

      await batch.commit();

    }

    console.info(`${ResetMatchesService.TAG}: User match status reset complete`);

  }

  private async resetMatchesCollection(): Promise<void> {

    console.info(`${ResetMatchesService.TAG}: Resetting matches collection`);

    const matchesQuery = query(
      collection(db, "matches"),
      where("matchType", "==", "test")
    );

    const matchesSnapshot = await getDocs(matchesQuery);

    if (matchesSnapshot.empty) {

      console.info(`${ResetMatchesService.TAG}: No matches found`);
      return;

    }

    const MAX_BATCH = 400;
    let batch = writeBatch(db);
    let count = 0;

    for (const matchDoc of matchesSnapshot.docs) {

      batch.update(doc(db, "matches", matchDoc.id), {
        expired: true
      });

      count++;

      if (count >= MAX_BATCH) {

        await batch.commit();

        batch = writeBatch(db);
        count = 0;

      }

    }

    if (count > 0) {

      await batch.commit();

    }

    console.info(`${ResetMatchesService.TAG}: Matches reset complete`);

  }

  private async cleanupPotentialMatches(  userDocs: QueryDocumentSnapshot<DocumentData>[]
): Promise<void> {

    console.info(`${ResetMatchesService.TAG}: Cleaning potential matches`);

    let totalDeleted = 0;

    for (const userDoc of userDocs) {

      const userId = userDoc.id;

      try {

        const potentialRef = collection(
          db,
          "users",
          userId,
          "potentialMatches"
        );

        const snapshot = await getDocs(potentialRef);

        if (!snapshot.empty) {

          await this.deletePotentialMatchesBatch(snapshot.docs);

          await updateDoc(doc(db, "users", userId), {

            potentialMatchesCount: 0,
            potentialMatchesLastUpdated: null

          });

          totalDeleted += snapshot.docs.length;

        }

      } catch (e) {

        console.error(
          `${ResetMatchesService.TAG}: Error cleaning ${userId}`,
          e
        );

      }

    }

    console.info(
      `${ResetMatchesService.TAG}: Deleted ${totalDeleted} potential matches`
    );

  }

  private async deletePotentialMatchesBatch(docs: QueryDocumentSnapshot<DocumentData>[]
): Promise<void> {

    const MAX_BATCH = 400;

    let batch = writeBatch(db);
    let count = 0;

    for (const docSnap of docs) {

      batch.delete(docSnap.ref);

      count++;

      if (count >= MAX_BATCH) {

        await batch.commit();

        batch = writeBatch(db);
        count = 0;

      }

    }

    if (count > 0) {

      await batch.commit();

    }

  }

}
