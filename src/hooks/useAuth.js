// hooks/useAuth.js
import React, { useState, useEffect } from "react";  // <-- Import React at the top
import { auth } from "../app/firebase/config";  // Make sure auth is imported correctly
import { onAuthStateChanged } from "firebase/auth";  // <-- Import the onAuthStateChanged function

// Create an Auth Context for sharing auth state across the app (optional)
const AuthContext = React.createContext();  // <-- Now it works because React is imported

// Custom hook to use auth
export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Subscribe to auth state changes
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    // Cleanup the subscription when the component is unmounted
    return () => unsubscribe();
  }, []);

  return { user, loading };
};

// Export the AuthContext if you want to use it globally in your app (optional)
export const AuthProvider = ({ children }) => {
  const { user, loading } = useAuth();

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
