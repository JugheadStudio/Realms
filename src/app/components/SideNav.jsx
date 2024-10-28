"use client";

import Link from "next/link";
import React from "react";
import Image from 'next/image';
import { auth } from "../firebase/config";  // Ensure this points to your Firebase config
import { signOut } from "firebase/auth";
import { useRouter } from "next/navigation";  // For redirecting after logout

import logo from '../assets/realms-logo.svg';
import profileIcon from '../assets/user-round.svg';

export default function SideNav() {
  const router = useRouter();

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
          <p className="text-md name">Han Solo</p>
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
            <Link href="/profile">MY PROFILE</Link>
          </li>
          <li className="mb-6">
            <Link href="/room">Room</Link>
          </li>
          <li className="mb-6">
            <Link href="/login">login</Link>
          </li>
        </ul>
      </nav>

      <button onClick={handleLogout} className="mt-10 text-red-500">
        Log Out
      </button>
    </div>
  );
}
