import { Timestamp } from "firebase/firestore";


export interface ImageState {
  docId: string;
  imagePath: string;
  replacedImagePath?: string | null;
  newImagePath?: string | null;
}

export class UserPromptStatus {
  constructor(
    public promptId: string,
    public question?: string,
    public answer?: string,
    public lastAskedAt?: Date,
    public nextEligibleAt?: Date
  ) {}

  static fromFirestore(
    data: Record<string, unknown>,
    docId: string
  ): UserPromptStatus {
    return new UserPromptStatus(
      docId,
      data.question as string | undefined,
      data.answer as string | undefined,
      data.lastAskedAt instanceof Timestamp
        ? data.lastAskedAt.toDate()
        : undefined,
      data.nextEligibleAt instanceof Timestamp
        ? data.nextEligibleAt.toDate()
        : undefined
    );
  }
}



export function userPromptStatusFromFirestore(
  data: Record<string, unknown>,
  docId: string
): UserPromptStatus {
  return {
    promptId: docId,
    question: data.question as string | undefined,
    answer: data.answer as string | undefined,
    lastAskedAt:
      data.lastAskedAt instanceof Timestamp
        ? data.lastAskedAt.toDate()
        : undefined,
    nextEligibleAt:
      data.nextEligibleAt instanceof Timestamp
        ? data.nextEligibleAt.toDate()
        : undefined,
  };
}


export class FirestoreUser {
  id: string;
  name: string;
  email?: string;
  age?: number;
  gender?: string;
  pronouns?: string[];
  sexuality?: string;
  interestedIn?: string[];
  birthday?: Date;
  minAge?: number;
  maxAge?: number;
  city?: string;
  isOnline?: boolean;
  verified?: boolean;
  isPremium?: boolean;
  markedForDeletion?: boolean;
  currentStep?: number;
  // Profile fields
  work?: string;
  jobTitle?: string;
  college?: string[];
  educationLevel?: string;
  religiousBeliefs?: string[];
  politics?: string;
  languagesSpoken?: string[];
  datingIntention?: string;
  createdAt?: Date;
  fcmToken?: string;
  history?: string[];
  // Collections
  images?: ImageState[];
  answeredPrompts?: UserPromptStatus[];

  constructor(data: Partial<FirestoreUser>) {
    this.id = data.id || '';
    this.name = data.name || '';
    this.email = data.email;
    this.age = data.age;
    this.gender = data.gender;
    this.pronouns = data.pronouns;
    this.sexuality = data.sexuality;
    this.interestedIn = data.interestedIn;
    this.birthday = data.birthday;
    this.minAge = data.minAge;
    this.maxAge = data.maxAge;
    this.city = data.city;
    this.isOnline = data.isOnline;
    this.verified = data.verified;
    this.isPremium = data.isPremium;
    this.markedForDeletion = data.markedForDeletion;
    this.currentStep = data.currentStep;
    this.work = data.work;
    this.jobTitle = data.jobTitle;
    this.college = data.college;
    this.educationLevel = data.educationLevel;
    this.religiousBeliefs = data.religiousBeliefs;
    this.politics = data.politics;
    this.languagesSpoken = data.languagesSpoken;
    this.datingIntention = data.datingIntention;
    this.createdAt = data.createdAt;
    this.fcmToken = data.fcmToken;
    this.history = data.history;
    this.images = data.images;
    this.answeredPrompts = data.answeredPrompts;
  }

  static fromMap(map: Record<string, unknown>, answeredPrompts: Array<UserPromptStatus>, userId:string, history :  Array<string>,  ): FirestoreUser {
    
     

    // Parse interestedIn if it exists
    let interestedIn: string[] | undefined;
    if (map.interestedIn) {
      try {
        interestedIn = typeof map.interestedIn === 'string'
          ? JSON.parse(map.interestedIn) as string[]
          : Array.isArray(map.interestedIn)
          ? map.interestedIn as string[]
          : undefined;
      } catch (e) {
        console.error('Error parsing interestedIn:', e);
        interestedIn = undefined;
      }
    }

    // Parse images if it exists
    let images: ImageState[] | undefined;
    if (map.images) {
      try {
        const imagesList = typeof map.images === 'string'
          ? JSON.parse(map.images)
          : map.images;
        
        images = Array.isArray(imagesList)
          ? imagesList.map((item: unknown) => {
              const img = item as Record<string, unknown>;
              return {
                docId: (img.docId as string) || '',
                imagePath: (img.imagePath as string) || '',
                replacedImagePath: (img.replacedImagePath as string) || null,
                newImagePath: (img.newImagePath as string) || null,
              };
            })
          : undefined;
      } catch (e) {
        console.error('Error parsing images:', e);
        images = undefined;
      }
    }

    // Parse pronouns if it exists
    let pronouns: string[] | undefined;
    if (map.pronouns) {
      try {
        pronouns = typeof map.pronouns === 'string'
          ? JSON.parse(map.pronouns) as string[]
          : Array.isArray(map.pronouns)
          ? map.pronouns as string[]
          : undefined;
      } catch (e) {
        console.error('Error parsing pronouns:', e);
        pronouns = undefined;
      }
    }

    // Parse college if it exists
    let college: string[] | undefined;
    if (map.college) {
      try {
        college = typeof map.college === 'string'
          ? JSON.parse(map.college) as string[]
          : Array.isArray(map.college)
          ? map.college as string[]
          : undefined;
      } catch (e) {
        console.error('Error parsing college:', e);
        college = undefined;
      }
    }

    // Parse religiousBeliefs if it exists
    let religiousBeliefs: string[] | undefined;
    if (map.religiousBeliefs) {
      try {
        religiousBeliefs = typeof map.religiousBeliefs === 'string'
          ? JSON.parse(map.religiousBeliefs) as string[]
          : Array.isArray(map.religiousBeliefs)
          ? map.religiousBeliefs as string[]
          : undefined;
      } catch (e) {
        console.error('Error parsing religiousBeliefs:', e);
        religiousBeliefs = undefined;
      }
    }

    // Parse languagesSpoken if it exists
    let languagesSpoken: string[] | undefined;
    if (map.languagesSpoken) {
      try {
        languagesSpoken = typeof map.languagesSpoken === 'string'
          ? JSON.parse(map.languagesSpoken) as string[]
          : Array.isArray(map.languagesSpoken)
          ? map.languagesSpoken as string[]
          : undefined;
      } catch (e) {
        console.error('Error parsing languagesSpoken:', e);
        languagesSpoken = undefined;
      }
    }

    return new FirestoreUser({
      id: userId,
      name: (map.name as string) || '',
      email: map.email as string | undefined,
      age: map.age != null ? Number(map.age) : undefined,
      gender: map.gender as string | undefined,
      pronouns,
      sexuality: map.sexuality as string | undefined,
      interestedIn,
      birthday: map.birthday ? new Date(map.birthday as string | number | Date) : undefined,
      minAge: map.minAge != null ? Number(map.minAge) : undefined,
      maxAge: map.maxAge != null ? Number(map.maxAge) : undefined,
      city: map.city as string | undefined,
      isOnline: map.isOnline as boolean | undefined,
      verified: map.verified as boolean | undefined,
      isPremium: map.isPremium as boolean | undefined,
      markedForDeletion: map.markedForDeletion as boolean | undefined,
      currentStep: map.currentStep != null ? Number(map.currentStep) : undefined,
      work: map.work as string | undefined,
      jobTitle: map.jobTitle as string | undefined,
      college,
      educationLevel: map.educationLevel as string | undefined,
      religiousBeliefs,
      politics: map.politics as string | undefined,
      languagesSpoken,
      datingIntention: map.datingIntention as string | undefined,
      createdAt: map.createdAt ? new Date(map.createdAt as string | number | Date) : undefined,
      fcmToken: map.fcmToken as string | undefined,
      history,
      images,
      answeredPrompts,
    });
  }

  static fromFirestore(
    data: Record<string, unknown>,
    answeredPrompts: UserPromptStatus[],
    userId: string,
    history: string[]
  ): FirestoreUser {
    console.debug(`image paths ${data.imagePaths} ${userId}`);
    console.debug(`user data for ${userId}`, data);

    // Parse interestedIn if it exists
    let interestedIn: string[] | undefined;
    if (data.interestedIn) {
      try {
        interestedIn = Array.isArray(data.interestedIn)
          ? (data.interestedIn as string[])
          : undefined;
      } catch (e) {
        console.error('Error parsing interestedIn:', e);
        interestedIn = undefined;
      }
    }

    // Parse images if it exists
    let images: ImageState[] | undefined;
    if (data.images) {
      try {
        const imagesList = Array.isArray(data.images) ? data.images : [];
        images = imagesList.map((item: unknown) => {
          const img = item as Record<string, unknown>;
          return {
            docId: (img.docId as string) || '',
            imagePath: (img.imagePath as string) || '',
            replacedImagePath: (img.replacedImagePath as string) || null,
            newImagePath: (img.newImagePath as string) || null,
          };
        });
      } catch (e) {
        console.error('Error parsing images:', e);
        images = undefined;
      }
    }

    // Parse pronouns if it exists
    let pronouns: string[] | undefined;
    if (data.pronouns && Array.isArray(data.pronouns)) {
      pronouns = data.pronouns as string[];
    }

    // Parse college if it exists
    let college: string[] | undefined;
    if (data.college && Array.isArray(data.college)) {
      college = data.college as string[];
    }

    // Parse religiousBeliefs if it exists
    let religiousBeliefs: string[] | undefined;
    if (data.religiousBeliefs && Array.isArray(data.religiousBeliefs)) {
      religiousBeliefs = data.religiousBeliefs as string[];
    }

    // Parse languagesSpoken if it exists
    let languagesSpoken: string[] | undefined;
    if (data.languagesSpoken && Array.isArray(data.languagesSpoken)) {
      languagesSpoken = data.languagesSpoken as string[];
    }

    return new FirestoreUser({
      id: userId,
      name: (data.name as string) || '',
      email: data.email as string | undefined,
      age: data.age != null ? Number(data.age) : undefined,
      gender: data.gender as string | undefined,
      pronouns,
      sexuality: data.sexuality as string | undefined,
      interestedIn,
      birthday: data.birthday ? new Date(data.birthday as string | number | Date) : undefined,
      minAge: data.minAge != null ? Number(data.minAge) : undefined,
      maxAge: data.maxAge != null ? Number(data.maxAge) : undefined,
      city: data.city as string | undefined,
      isOnline: data.isOnline as boolean | undefined,
      verified: data.verified as boolean | undefined,
      isPremium: data.isPremium as boolean | undefined,
      markedForDeletion: data.markedForDeletion as boolean | undefined,
      currentStep: data.currentStep != null ? Number(data.currentStep) : undefined,
      work: data.work as string | undefined,
      jobTitle: data.jobTitle as string | undefined,
      college,
      educationLevel: data.educationLevel as string | undefined,
      religiousBeliefs,
      politics: data.politics as string | undefined,
      languagesSpoken,
      datingIntention: data.datingIntention as string | undefined,
      createdAt: data.createdAt ? new Date(data.createdAt as string | number | Date) : undefined,
      fcmToken: (data.fcmToken as string) || '',
      history,
      images,
      answeredPrompts,
    });
  }

 toMap(): Record<string, unknown> {
  return {
    id: this.id,
    name: this.name,
    interestedIn: this.interestedIn ?? null,
    pronouns: this.pronouns ?? null,
    college: this.college ?? null,
    religiousBeliefs: this.religiousBeliefs ?? null,
    languagesSpoken: this.languagesSpoken ?? null,
    history: this.history ?? [],
    images: this.images ?? [],
    answeredPrompts: this.answeredPrompts ?? [],
  };
}


  toJson(): Record<string, unknown> {
    return {
      id: this.id,
      name: this.name,
      email: this.email,
      age: this.age,
      gender: this.gender,
      pronouns: this.pronouns,
      sexuality: this.sexuality,
      interestedIn: this.interestedIn,
      birthday: this.birthday?.toISOString(),
      minAge: this.minAge,
      maxAge: this.maxAge,
      city: this.city,
      isOnline: this.isOnline,
      verified: this.verified,
      isPremium: this.isPremium,
      markedForDeletion: this.markedForDeletion,
      currentStep: this.currentStep,
      work: this.work,
      jobTitle: this.jobTitle,
      college: this.college,
      educationLevel: this.educationLevel,
      religiousBeliefs: this.religiousBeliefs,
      politics: this.politics,
      languagesSpoken: this.languagesSpoken,
      datingIntention: this.datingIntention,
      createdAt: this.createdAt?.toISOString(),
      fcmToken: this.fcmToken,
      history: this.history,
      images: this.images,
      answeredPrompts: this.answeredPrompts,
    };
  }
}