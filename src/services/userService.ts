import { 
  collection, 
  getDocs, 
  doc, 
  getDoc, 
  deleteDoc, 
  updateDoc,
  DocumentData 
} from 'firebase/firestore';
import { db } from '../firebase';
import { FirestoreUser, ImageState, UserPromptStatus } from '../types';

export class UserService {
  private usersCollection = collection(db, 'users');

  /**
   * Fetch all users from Firestore
   */
  async getAllUsers(): Promise<FirestoreUser[]> {
    try {
      const querySnapshot = await getDocs(this.usersCollection);
      const users: FirestoreUser[] = [];

      for (const docSnap of querySnapshot.docs) {
        const userData = docSnap.data();
        const userId = docSnap.id;

        // Fetch images subcollection
        const images = await this.getUserImages(userId);
        
        // Fetch answered prompts subcollection
        const answeredPrompts = await this.getUserPrompts(userId);

       users.push(
  new FirestoreUser({
    id: userId,
    name: userData.name || 'Unknown',
    email: userData.email,
    age: userData.age,
    gender: userData.gender,
    pronouns: userData.pronouns,
    sexuality: userData.sexuality,
    interestedIn: userData.interestedIn,
    birthday: userData.birthday?.toDate(),
    createdAt: userData.createdAt?.toDate(),
    minAge: userData.minAge,
    maxAge: userData.maxAge,
    city: userData.city,
    isOnline: userData.isOnline || false,
    verified: userData.verificationStatus === 'verified',
    isPremium: userData.isPremium || false,
    markedForDeletion: userData.markedForDeletion || false,
    currentStep: userData.currentStep,
    work: userData.work,
    jobTitle: userData.jobTitle,
    college: userData.college,
    educationLevel: userData.educationLevel,
    religiousBeliefs: userData.religiousBeliefs,
    politics: userData.politics,
    languagesSpoken: userData.languagesSpoken,
    datingIntention: userData.datingIntention,
    images,
    answeredPrompts,
  })
);

      }

      return users;
    } catch (error) {
      console.error('Error fetching users:', error);
      throw error;
    }
  }

  /**
   * Fetch a single user by ID with all subcollections
   */
  async getUserById(userId: string): Promise<FirestoreUser | null> {
    try {
      const userDoc = await getDoc(doc(this.usersCollection, userId));
      
      if (!userDoc.exists()) {
        return null;
      }

      const userData = userDoc.data();
      const images = await this.getUserImages(userId);
      const answeredPrompts = await this.getUserPrompts(userId);

      return new FirestoreUser ({
        id: userId,
        name: userData.name || 'Unknown',
        email: userData.email,
        age: userData.age,
        gender: userData.gender,
        pronouns: userData.pronouns,
        sexuality: userData.sexuality,
        interestedIn: userData.interestedIn,
        birthday: userData.birthday?.toDate(),
        createdAt: userData.createdAt?.toDate(),
        minAge: userData.minAge,
        maxAge: userData.maxAge,
        city: userData.city,
        isOnline: userData.isOnline || false,
        verified: userData.verificationStatus === 'verified',
        isPremium: userData.isPremium || false,
        markedForDeletion: userData.markedForDeletion || false,
        currentStep: userData.currentStep,
        work: userData.work,
        jobTitle: userData.jobTitle,
        college: userData.college,
        educationLevel: userData.educationLevel,
        religiousBeliefs: userData.religiousBeliefs,
        politics: userData.politics,
        languagesSpoken: userData.languagesSpoken,
        datingIntention: userData.datingIntention,
        images,
        answeredPrompts,
      });
    } catch (error) {
      console.error('Error fetching user:', error);
      throw error;
    }
  }

  /**
   * Fetch user images from subcollection
   */
  private async getUserImages(userId: string): Promise<ImageState[]> {
    try {
      const imagesCollection = collection(db, 'users', userId, 'images');
      const imagesSnapshot = await getDocs(imagesCollection);
      
      return imagesSnapshot.docs.map(doc => ({
        docId: doc.id,
        imagePath: doc.data().imagePath || '',
        replacedImagePath: doc.data().replacedImagePath || null,
        newImagePath: doc.data().newImagePath || null,
      }));
    } catch (error) {
      console.error(`Error fetching images for user ${userId}:`, error);
      return [];
    }
  }

  /**
   * Fetch user prompts from subcollection
   */
  private async getUserPrompts(userId: string): Promise<UserPromptStatus[]> {
    try {
      const promptsCollection = collection(db, 'users', userId, 'answeredPrompts');
      const promptsSnapshot = await getDocs(promptsCollection);
      
      return promptsSnapshot.docs.map(doc => ({
        promptId: doc.id,
        answer: doc.data().answer,
        question: doc.data().question,
        lastAskedAt: doc.data().lastAskedAt?.toDate(),
        nextEligibleAt: doc.data().nextEligibleAt?.toDate(),
      }));
    } catch (error) {
      console.error(`Error fetching prompts for user ${userId}:`, error);
      return [];
    }
  }

  /**
   * Delete a user and all subcollections
   */
  async deleteUser(userId: string): Promise<void> {
    try {
      // Delete images subcollection
      const imagesCollection = collection(db, 'users', userId, 'images');
      const imagesSnapshot = await getDocs(imagesCollection);
      const imageDeletePromises = imagesSnapshot.docs.map(doc => deleteDoc(doc.ref));
      await Promise.all(imageDeletePromises);

      // Delete prompts subcollection
      const promptsCollection = collection(db, 'users', userId, 'answeredPrompts');
      const promptsSnapshot = await getDocs(promptsCollection);
      const promptDeletePromises = promptsSnapshot.docs.map(doc => deleteDoc(doc.ref));
      await Promise.all(promptDeletePromises);

      // Delete the user document
      await deleteDoc(doc(this.usersCollection, userId));
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  }

  /**
   * Update user data
   */
  async updateUser(userId: string, data: Partial<FirestoreUser>): Promise<void> {
    try {
      const userRef = doc(this.usersCollection, userId);
      const updateData: DocumentData = { ...data };
      
      // Remove nested objects and arrays that shouldn't be directly updated
      delete updateData.images;
      delete updateData.answeredPrompts;
      delete updateData.id;
      
      await updateDoc(userRef, updateData);
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  }
}

export const userService = new UserService();