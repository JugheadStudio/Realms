import { db } from "./config";
import { doc, setDoc, getDoc } from "firebase/firestore";

// Create or update user profile
export const updateUserProfile = async (userId, profileData) => {
  await setDoc(doc(db, "users", userId), profileData, { merge: true });
};

// Get user profile
export const getUserProfile = async (userId) => {
  const docRef = doc(db, "users", userId);
  const docSnap = await getDoc(docRef);
  return docSnap.exists() ? docSnap.data() : null;
};
