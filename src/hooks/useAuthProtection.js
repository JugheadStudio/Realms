'use client';  // Ensure the file is marked as a client component

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { auth } from "../app/firebase/config";

export function useAuthProtection() {
  const router = useRouter();

  useEffect(() => {
    // Listen for changes to the user's authentication state
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (!user) {
        router.push("/login");  // Redirect to the login page if not authenticated
      }
    });

    // Clean up the subscription on unmount
    return () => unsubscribe();
  }, [router]);
}
