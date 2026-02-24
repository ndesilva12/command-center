"use client";

import { useState, useEffect } from "react";
import { User } from "firebase/auth";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

export interface UserData {
  email: string;
  displayName: string;
  role: "admin" | "user";
  permissions: string[];
  createdAt: number;
  lastLogin: number;
}

// Helper to set a cookie
const setCookie = (name: string, value: string, days: number = 30) => {
  const expires = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toUTCString();
  document.cookie = `${name}=${value}; expires=${expires}; path=/; SameSite=Lax`;
};

// Helper to delete a cookie
const deleteCookie = (name: string) => {
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
};

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (firebaseUser) => {
      setUser(firebaseUser);
      
      if (firebaseUser) {
        // Set userId cookie for API routes
        setCookie('userId', firebaseUser.uid);
        
        // Fetch user data from Firestore
        const userRef = doc(db, "users", firebaseUser.uid);
        const userSnap = await getDoc(userRef);
        
        if (userSnap.exists()) {
          const data = userSnap.data() as UserData;
          setUserData(data);
          
          // Update lastLogin timestamp
          await updateDoc(userRef, {
            lastLogin: Date.now(),
          });
        }
      } else {
        // Clear userId cookie on logout
        deleteCookie('userId');
        setUserData(null);
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return {
    user,
    userData,
    loading,
    isAdmin: userData?.role === "admin",
    hasPermission: (toolId: string) => {
      if (!userData) return false;
      if (userData.role === "admin") return true;
      return userData.permissions?.includes(toolId) || false;
    },
  };
}
