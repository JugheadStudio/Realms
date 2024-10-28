import { auth } from "./config";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from "firebase/auth";

// Sign up
export const signUp = (email, password) => createUserWithEmailAndPassword(auth, email, password);

// Sign in
export const signIn = (email, password) => signInWithEmailAndPassword(auth, email, password);

// Sign out
export const logOut = () => signOut(auth);
