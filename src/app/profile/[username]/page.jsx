"use client";

import { useState, useEffect } from "react";
import { useAuth } from "../../../hooks/useAuth";
import { db } from "../../firebase/config";
import { doc, getDoc, setDoc, collection, query, where, getDocs } from "firebase/firestore";
import FriendsModal from "../../components/FriendsModal";
import Button from 'react-bootstrap/Button';

const ProfilePage = ({ params }) => {
  const { user, loading } = useAuth();
  const { username } = params; // Username from the URL params
  const [profileData, setProfileData] = useState(null);
  const [error, setError] = useState(null);
  const [friendRequestSent, setFriendRequestSent] = useState(false); 
  const [showFriends, setShowFriends] = useState(false);

  const handleFriendsClose = () => setShowFriends(false);
  const handleFriendsShow = () => setShowFriends(true);

  useEffect(() => {
    if (user?.uid && username) {
      const fetchUserProfile = async () => {
        try {
          // Query users collection by username
          const userRef = collection(db, "users");
          const q = query(userRef, where("username", "==", username));
          const querySnapshot = await getDocs(q);

          if (querySnapshot.empty) {
            setError("Profile not found");
            return;
          }

          // Assuming there's only one document with this username
          const docSnap = querySnapshot.docs[0];
          const data = docSnap.data();

          // Now set profile data including the UID
          setProfileData(data);
        } catch (err) {
          console.error("Error fetching profile:", err);
          setError("Failed to fetch profile");
        }
      };

      fetchUserProfile();
    }
  }, [username, user]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>{error}</div>;

  const handleAddFriend = async () => {
    try {
      const friendRequest = {
        senderId: user.uid,
        receiverUsername: profileData.username,
        status: "pending", // Request status
      };

      const friendRequestRef = doc(db, "friendRequests", `${user.uid}_${profileData.uid}`);
      await setDoc(friendRequestRef, friendRequest);

      setFriendRequestSent(true);  // Set state to indicate request sent
      alert("Friend request sent!");
    } catch (error) {
      console.error("Error sending friend request:", error);
      setError("Failed to send friend request.");
    }
  };

  // Debugging
  console.log("Profile Data UID:", profileData?.uid);
  console.log("User UID:", user?.uid);

  return (
    <div className="profile-page">
      <h1>{profileData?.username}'s Profile</h1>
      <p>Email: {profileData?.email}</p>

      {/* For your own profile */}
      {user?.uid === profileData?.uid ? (
        <>
          <button>Edit Profile</button>
          <Button variant="primary" onClick={handleFriendsShow}>View Friends</Button>
        </>
      ) : (
        // For someone else's profile
        <>
          <button onClick={handleAddFriend} disabled={friendRequestSent}>Add Friend</button>
          <Button variant="primary" onClick={handleFriendsShow}>View Friends</Button>
        </>
      )}

      {/* Render FriendsModal only if profileData is available */}
      {profileData?.uid && (
        <FriendsModal show={showFriends} onHide={handleFriendsClose} userId={profileData?.uid} />
      )}
    </div>
  );
};

export default ProfilePage;
