import { db } from "../firebase/config";
import { doc, setDoc, serverTimestamp, getDocs, collection, query, where } from "firebase/firestore";

export async function createUserProfile(user, username) {
  if (!user) return;

  try {
    await setDoc(doc(db, "users", user.uid), {
      email: user.email,
      username: username.toLowerCase(),
      profilePicture: "",
      isAdmin: false,
      createdAt: serverTimestamp(),
      friends: [],
      friendRequests: [],
      notfications: [],
      uid: user.uid,
    });
  } catch (error) {
    console.error("Error creating user profile:", error);
    throw error;
  }
}

// Function to check if a username already exists, case-insensitive
export async function isUsernameTaken(username) {
  const usernameQuery = query(
    collection(db, "users"),
    where("username", "==", username.toLowerCase())
  );
  const querySnapshot = await getDocs(usernameQuery);

  return !querySnapshot.empty;
}
