// src/app/utils/firebaseUsers.js

import { db } from "../firebase/config";
import { doc, setDoc, serverTimestamp, getDocs, collection, query, where } from "firebase/firestore";

// Function to create user profile in Firestore with lowercase username
export async function createUserProfile(user, username) {
  if (!user) return;

  try {
    await setDoc(doc(db, "users", user.uid), {
      email: user.email,
      username: username.toLowerCase(), // Save username in lowercase
      profilePicture: "",
      isAdmin: false,
      createdAt: serverTimestamp(),
      friends: [],
      friendRequests: [],
    });
  } catch (error) {
    console.error("Error creating user profile:", error);
    throw error;
  }
}

// Function to check if a username already exists, case-insensitively
export async function isUsernameTaken(username) {
  const usernameQuery = query(
    collection(db, "users"),
    where("username", "==", username.toLowerCase())
  );
  const querySnapshot = await getDocs(usernameQuery);

  return !querySnapshot.empty; // Returns true if username is taken
}
