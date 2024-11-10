"use client";

import Link from "next/link";
import React, { useEffect, useState } from "react";
import Image from 'next/image';
import { auth, db } from "../firebase/config";
import { signOut, onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, onSnapshot, updateDoc, arrayRemove } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { Button } from "react-bootstrap";

import logo from '../assets/realms-logo.svg';
import profileIcon from '../assets/user-round.svg'; // Default SVG icon
import notificationsIcon from '../assets/notifications.svg';
import { formatDistanceToNow } from 'date-fns';

export default function SideNav() {
  const router = useRouter();
  const [username, setUsername] = useState(null);
  const [profilePicture, setProfilePicture] = useState(null);
  const [notificationCount, setNotificationCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [user, setUser] = useState(null);

  const getUsernameByUID = async (uid) => {
    const userDoc = await getDoc(doc(db, "users", uid));
    return userDoc.exists() ? userDoc.data().username : "Unknown User";
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUser(user);
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
          setUsername(userDoc.data().username);
          setProfilePicture(userDoc.data().profilePicture || null);
        }

        const notificationsRef = doc(db, "users", user.uid);
        const unsubscribeNotifications = onSnapshot(notificationsRef, async (docSnap) => {
          if (docSnap.exists()) {
            const notificationsData = docSnap.data().notifications || [];
            const notificationsWithUsernames = await Promise.all(
              notificationsData.map(async (notification) => {
                const fromUserName = await getUsernameByUID(notification.fromUser);
                return { ...notification, fromUserName };
              })
            );

            const unreadCount = notificationsWithUsernames.filter(notification => !notification.read).length;
            setNotificationCount(unreadCount);
            setNotifications(notificationsWithUsernames);
          }
        });

        return () => unsubscribeNotifications();
      } else {
        setUser(null);
        setUsername(null);
        setProfilePicture(null);
      }
    });
    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    await signOut(auth);
    router.push("/");
  };

  const toggleNotifications = () => {
    setShowNotifications((prev) => !prev);
  };

  const handleJoinRoom = async (roomCode, notificationIndex) => {
    router.push(`/lobby/${roomCode}`);
    setShowNotifications(false);

    if (user) {
      const userDocRef = doc(db, "users", user.uid);
      try {
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          const notifications = userDoc.data().notifications || [];
          const updatedNotifications = notifications.filter((_, index) => index !== notificationIndex);
          await updateDoc(userDocRef, { notifications: updatedNotifications });
        }
      } catch (error) {
        console.error("Error removing notification:", error);
      }
    }
  };

  return (
    <div className="col-span-2 h-screen text-white">
      <div className="navbar-logo-container">
        <Image src={logo} alt="Logo" width={140} />
      </div>

      <hr />

      {/* Profile or Login Button */}
      <div className="d-flex justify-content-between navbar-user">
        {user ? (
          <>
            <Link href={`/profile/${username}`} className="flex items-center gap-3">
              <span>
                <Image src={profilePicture ? profilePicture : profileIcon} alt="Profile picture" width={30} height={30}/>
              </span>
              <div className="flex flex-col">
                <p className="text-md name">{username || "Loading..."}</p>
                <p className="text-sm type">Free User</p>
              </div>
            </Link>

            <div className="flex items-center">
              <span className="relative">
                <Image src={notificationsIcon} alt="Notifications Icon" width={30} onClick={toggleNotifications} className="cursor-pointer"/>
                {notificationCount > 0 && (
                  <span className="notifications-count bg-red-500 rounded-full text-xs w-5 h-5 flex justify-center">
                    {notificationCount}
                  </span>
                )}

                {showNotifications && (
                  <div className="notifications-dropdown text-white shadow-lg z-10">
                    <div className="notification-header">
                      <h3 className="text-sm font-semibold">Notifications</h3>
                    </div>
                    <hr />
                    <div className="notifications-item-container max-h-64 overflow-y-auto">
                      {notifications.length > 0 ? (
                        notifications.map((notification, index) => (
                          <div key={index} className="notification-item d-flex justify-content-between">
                            <div>
                              <p className="text-xs">
                                New invite from <strong>{notification.fromUserName}</strong>
                              </p>
                              <p className="text-xs notification-timestamp">
                                {notification.timestamp
                                  ? `${formatDistanceToNow(new Date(notification.timestamp))} ago`
                                  : 'Invalid Date'}
                              </p>
                            </div>
                            <div>
                              <Button variant="join" onClick={() => handleJoinRoom(notification.roomCode, index)} className="mt-1 text-xs">
                                Join
                              </Button>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-xs text-gray-400">No new notifications</p>
                      )}
                    </div>
                  </div>
                )}
              </span>
            </div>
          </>
        ) : (
          <div>
            <Link href="/login">
              <Button variant="primary" className="w-full text-white">
                Login
              </Button>
            </Link>
          </div>
        )}
      </div>

      <hr />
      <nav className="mt-10">
        <ul className="sidenav-links">
          <li>
            <Link href="/">HOME</Link>
          </li>
          <li className="mb-6">
            <Link href="/discover">DISCOVER</Link>
          </li>
          <li className="mb-6">
            {user && (
              <button onClick={handleLogout} className="mt-2 text-red-500">
                Log Out
              </button>
            )}
          </li>
        </ul>
      </nav>
    </div>
  );
}