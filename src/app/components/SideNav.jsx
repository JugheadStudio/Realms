"use client";

import Link from "next/link";
import React, { useEffect, useState } from "react";
import Image from 'next/image';
import { auth, db } from "../firebase/config";  // Ensure this points to your Firebase config
import { signOut, onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";  // For redirecting after logout

import logo from '../assets/realms-logo.svg';
import profileIcon from '../assets/user-round.svg';

export default function SideNav() {
  const router = useRouter();
  const [username, setUsername] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // Fetch the username from Firestore based on user UID
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
          setUsername(userDoc.data().username);
        }
      }
    });
    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    await signOut(auth);
    router.push("/");  // Redirects to home page after logout
  };

  return (
    <div className="col-span-2 h-screen text-white">
      <div className="navbar-logo-container">
        <Image src={logo} alt="Logo" width={140} />
      </div>

      <hr />

      <div className="flex items-center gap-3 navbar-user">
        <span>
          <Image src={profileIcon} alt="Logo" width={30} />
        </span>
        <div className="flex flex-col">
          <p className="text-md name">{username || "Loading..."}</p>
          <p className="text-sm type">Free User</p>
        </div>
      </div>

      <hr />
      <nav className="mt-10">
        <ul>
          <li className="mb-6">
            <Link href="/">HOME</Link>
          </li>
          <li className="mb-6">
            <Link href="/discover">DISCOVER</Link>
          </li>
          <li className="mb-6">
            {/* Link to the dynamic profile page */}
            {username && (
              <Link href={`/profile/${username}`}>MY PROFILE</Link>
            )}
          </li>
          <li className="mb-6">
            <Link href="/room">Room</Link>
          </li>
          <li className="mb-6">
            <Link href="/login">Login</Link>
          </li>
        </ul>
      </nav>

      <button onClick={handleLogout} className="mt-10 text-red-500">
        Log Out
      </button>
    </div>
  );
}