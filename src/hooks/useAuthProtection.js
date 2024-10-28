import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { auth } from "../app/firebase/config"; // Ensure this path matches your Firebase setup

export function useAuthProtection() {
  const router = useRouter();

  useEffect(() => {
    // Listen for changes to the user's authentication state
    const unsubscribe = auth.onAuthStateChanged((user) => {
      // If no user is logged in, redirect to the login page
      if (!user) {
        router.push("/login");
      }
    });

    // Clean up the subscription when the component unmounts
    return () => unsubscribe();
  }, [router]);
}
