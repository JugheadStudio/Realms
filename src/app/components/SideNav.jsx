"use client";

import Link from "next/link";
import React, { useEffect, useState } from "react";
import Image from 'next/image';
import { auth, db } from "../firebase/config";
import { signOut, onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, onSnapshot, updateDoc, arrayRemove } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { Container, Row, Col, Button, ListGroup, Modal, Form } from "react-bootstrap";

import logo from '../assets/realms-logo.svg';
import profileIcon from '../assets/user-round.svg';
import notificationsIcon from '../assets/notifications.svg';
import { format } from 'date-fns';
import { formatDistanceToNow } from 'date-fns';

export default function SideNav() {
  const router = useRouter();
  const [username, setUsername] = useState(null);
  const [notificationCount, setNotificationCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);

  const getUsernameByUID = async (uid) => {
    const userDoc = await getDoc(doc(db, "users", uid));
    return userDoc.exists() ? userDoc.data().username : "Unknown User";
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
          setUsername(userDoc.data().username);
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

    const user = auth.currentUser;
    if (user) {
      const userDocRef = doc(db, "users", user.uid);

      try {
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          const notifications = userDoc.data().notifications || [];

          const updatedNotifications = notifications.filter(
            (_, index) => index !== notificationIndex
          );

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

      <div className="d-flex justify-content-between navbar-user">
        <div className="flex items-center gap-3">
          <span>
            <Image src={profileIcon} alt="Profile picture" width={30} />
          </span>
          <div className="flex flex-col">
            <p className="text-md name">{username || "Loading..."}</p>
            <p className="text-sm type">Free User</p>
          </div>
        </div>
        <div>
          <span className="relative">
            <Image
              src={notificationsIcon}
              alt="Notifications Icon"
              width={30}
              onClick={toggleNotifications}
              className="cursor-pointer"
            />
            {notificationCount > 0 && (
              <span className="notifications-count bg-red-500 rounded-full text-xs w-5 h-5 flex items-center justify-center">
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
            {username && <Link href={`/profile/${username}`}>MY PROFILE</Link>}
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