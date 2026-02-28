import {
  getFirestore,
  doc,
  setDoc,
  collection,
  addDoc,
  serverTimestamp
} from 'firebase/firestore';

const db = getFirestore();

interface AnsweredPrompt {
  answer: string;
  lastAskedAt: Date;
  nextEligibleAt: Date;
}

interface TestUser {
  userId: string;
  currentStep: number;
  imagePaths: string[];
  name: string;
  gender: string;
  pronouns: string[];
  sexuality: string;
  interestedIn: string[];
  age: number;
  birthday: Date;
  minAge: number;
  maxAge: number;
  isOnline: boolean;
  isPremium: boolean;
  verificationStatus: string;
  markedForDeletion: boolean;
  potentialMatchesCount: number;
  userType: string;
  work: string;
  jobTitle: string;
  city: string;
  college: string[];
  educationLevel: string;
  religiousBeliefs: string[];
  politics: string;
  languagesSpoken: string[];
  datingIntention: string;
  answeredPrompt: { [key: string]: AnsweredPrompt };
}

/**
 * Creates a test user in Firestore with answered prompts and images
 * Similar to uploadKrithiToFirestore from the Flutter app
 */
export const createTestUser = async (imagePaths: string[]): Promise<void> => {
  if (!imagePaths || imagePaths.length !== 6) {
    throw new Error('Exactly 6 images are required to create a test user.');
  }

  const testUser: TestUser = {
    userId: "keiani@influencer.test",
    currentStep: 8,
    imagePaths,
    name: "Keiani",
    gender: "Woman",
    pronouns: ["She/Her"],
    sexuality: "Straight",
    interestedIn: ["Man"],
    age: 23,
    birthday: new Date(2002, 6, 18), // July 18, 2002
    minAge: 21,
    maxAge: 30,
    isOnline: true,
    isPremium: true,
    verificationStatus: "verified",
    markedForDeletion: false,
    potentialMatchesCount: 67,
    userType: "test",
    work: "Social Media",
    jobTitle: "Content Creator / Vlogger",
    city: "Los Angeles",
    college: [],
    educationLevel: "College",
    religiousBeliefs: ["Spiritual"],
    politics: "Not political",
    languagesSpoken: ["English"],
    datingIntention: "Short-term",
    answeredPrompt: {
      ei_001: {
        answer: "Consistency is attractive. Not just words.",
        lastAskedAt: new Date(),
        nextEligibleAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
      sr_010: {
        answer: "Sunset drives, camera rolling, music loud.",
        lastAskedAt: new Date(),
        nextEligibleAt: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
      },
      ei_006: {
        answer: "Emotionally stable. No chaos energy.",
        lastAskedAt: new Date(),
        nextEligibleAt: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
      },
      dm_007: {
        answer: "Make me laugh. I’ll vlog about you.",
        lastAskedAt: new Date(),
        nextEligibleAt: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
      },
      ge_006: {
        answer: "Protecting my peace and my brand.",
        lastAskedAt: new Date(),
        nextEligibleAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      },
      lb_005: {
        answer: "Matcha, skincare, and getting ready on FaceTime.",
        lastAskedAt: new Date(),
        nextEligibleAt: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
      },
      rp_001: {
        answer: "If it’s forced, it’s not for me.",
        lastAskedAt: new Date(),
        nextEligibleAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      },
      ic_002: {
        answer: "Confident, calm, and secure in himself.",
        lastAskedAt: new Date(),
        nextEligibleAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      },
    },
  };
  try {
    const userId = testUser.userId;
    const answeredPrompts = testUser.answeredPrompt;
    const imagePaths = testUser.imagePaths;

    // Extract data that shouldn't be stored at root level
    const { answeredPrompt: _unusedPrompts, imagePaths: _unusedImages, ...userDataToStore } = testUser;

    // Set main user document
    const userDocRef = doc(db, 'users', userId);
    await setDoc(userDocRef, userDataToStore);

    // Add answered prompts to subcollection
    const promptsCollectionRef = collection(userDocRef, 'answeredPrompts');
    for (const [promptId, promptData] of Object.entries(answeredPrompts)) {
      await setDoc(doc(promptsCollectionRef, promptId), promptData);
    }

    // Add images to subcollection
    const imagesCollectionRef = collection(userDocRef, 'images');
    for (const imagePath of imagePaths) {
      await addDoc(imagesCollectionRef, {
        imagePath,
        createdAt: serverTimestamp(),
      });
    }

    console.log('Successfully created test user Vivie in Firestore!');
  } catch (error) {
    console.error('Error creating test user:', error);
    throw error;
  }
};