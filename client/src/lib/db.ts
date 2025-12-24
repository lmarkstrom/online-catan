import { db } from "./firebase";
import { doc, setDoc, getDoc } from "firebase/firestore";

export interface UserData {
  uid: string;
  email: string;
  displayName: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Create a new user document in Firestore
 */
export const createUserDocument = async (
  uid: string,
  email: string,
  displayName: string
): Promise<UserData> => {
  const userData: UserData = {
    uid,
    email,
    displayName,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  try {
    await setDoc(doc(db, "users", uid), userData);
    return userData;
  } catch (error) {
    console.error("Error creating user document:", error);
    throw error;
  }
};

/**
 * Get user document from Firestore
 */
export const getUserDocument = async (uid: string): Promise<UserData | null> => {
  try {
    const userDoc = await getDoc(doc(db, "users", uid));
    if (userDoc.exists()) {
      return userDoc.data() as UserData;
    }
    return null;
  } catch (error) {
    console.error("Error getting user document:", error);
    throw error;
  }
};

/**
 * Update user document in Firestore
 */
export const updateUserDocument = async (
  uid: string,
  updates: Partial<UserData>
): Promise<void> => {
  try {
    await setDoc(
      doc(db, "users", uid),
      { ...updates, updatedAt: new Date() },
      { merge: true }
    );
  } catch (error) {
    console.error("Error updating user document:", error);
    throw error;
  }
};
