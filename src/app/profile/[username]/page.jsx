"use client";

import { useState, useEffect } from "react";
import { useAuth } from "../../../hooks/useAuth";
import { db } from "../../firebase/config";
import { doc, getDoc, setDoc, collection, query, where, getDocs, updateDoc } from "firebase/firestore";
import FriendsModal from "../../components/FriendsModal";
import Button from 'react-bootstrap/Button';
import { ListGroup } from 'react-bootstrap';

const ProfilePage = ({ params }) => {
  const { user, loading } = useAuth();
  const { username } = params; // Username from the URL params
  const [profileData, setProfileData] = useState(null);
  const [error, setError] = useState(null);
  const [friendRequestSent, setFriendRequestSent] = useState(false);
  const [showFriends, setShowFriends] = useState(false);
  const [friendRequests, setFriendRequests] = useState([]);

  const handleFriendsClose = () => setShowFriends(false);
  const handleFriendsShow = () => setShowFriends(true);

  // Fetch profile data based on username
  useEffect(() => {
    if (user?.uid && username) {
      const fetchUserProfile = async () => {
        try {
          const userRef = collection(db, "users");
          const q = query(userRef, where("username", "==", username));
          const querySnapshot = await getDocs(q);

          if (querySnapshot.empty) {
            setError("Profile not found");
            return;
          }

          const docSnap = querySnapshot.docs[0];
          const data = docSnap.data();

          setProfileData(data);
        } catch (err) {
          console.error("Error fetching profile:", err);
          setError("Failed to fetch profile");
        }
      };

      fetchUserProfile();
    }
  }, [username, user]);

  // Fetch incoming friend requests for the logged-in user
  useEffect(() => {
    const fetchFriendRequests = async () => {
      if (!user?.uid) return;

      try {
        const userDocRef = doc(db, "users", user.uid);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
          const userData = userDoc.data();
          // Separate sent and received friend requests
          const receivedRequests = userData.friendRequests?.filter(
            (request) => request.status === "pending" && request.receiverId === user.uid
          ) || [];
          const sentRequests = userData.friendRequests?.filter(
            (request) => request.status === "pending" && request.senderId === user.uid
          ) || [];

          setFriendRequests({ received: receivedRequests, sent: sentRequests });
        }
      } catch (error) {
        console.error("Error fetching friend requests:", error);
      }
    };

    fetchFriendRequests();
  }, [user?.uid]);

  // Prevent loading screen from appearing if the user is authenticated
  if (loading) return <div>Loading...</div>;
  if (error) return <div>{error}</div>;

  // Send friend request
  const handleAddFriend = async () => {
    try {
      const friendRequest = {
        senderId: user.uid,
        receiverId: profileData.uid,
        senderUsername: user.displayName,
        receiverUsername: profileData.username,
        status: "pending",
      };

      const friendRequestRef = doc(db, "friendRequests", `${user.uid}_${profileData.uid}`);
      await setDoc(friendRequestRef, friendRequest);

      setFriendRequestSent(true);
      alert("Friend request sent!");
    } catch (error) {
      console.error("Error sending friend request:", error);
      setError("Failed to send friend request.");
    }
  };

  // Accept Friend Request
  const handleAcceptFriendRequest = async (requestId, senderId) => {
    try {
      const userRef = doc(db, "users", user.uid);
      const userSnapshot = await getDoc(userRef);

      const senderRef = doc(db, "users", senderId);
      const senderSnapshot = await getDoc(senderRef);

      if (userSnapshot.exists() && senderSnapshot.exists()) {
        const userData = userSnapshot.data();
        const senderData = senderSnapshot.data();

        // Add sender as a friend
        await updateDoc(userRef, {
          friends: [...userData.friends, senderId],
          friendRequests: userData.friendRequests.filter(
            (request) => request.senderId !== senderId
          ), // Remove the accepted request
        });

        // Add user as a friend to sender
        await updateDoc(senderRef, {
          friends: [...senderData.friends, user.uid],
          friendRequests: senderData.friendRequests.filter(
            (request) => request.receiverId !== user.uid
          ), // Remove the accepted request
        });

        alert("Friend request accepted!");
      } else {
        alert("User not found.");
      }
    } catch (error) {
      console.error("Error accepting friend request:", error);
      alert("Failed to accept friend request.");
    }
  };

  // Decline Friend Request
  const handleDeclineFriendRequest = async (requestId, senderId) => {
    try {
      const userRef = doc(db, "users", user.uid);
      const senderRef = doc(db, "users", senderId);

      const userSnapshot = await getDoc(userRef);
      const senderSnapshot = await getDoc(senderRef);

      if (userSnapshot.exists() && senderSnapshot.exists()) {
        const userData = userSnapshot.data();
        const senderData = senderSnapshot.data();

        // Remove the declined request from the receiver's friendRequests array
        await updateDoc(userRef, {
          friendRequests: userData.friendRequests.filter(
            (request) => request.id !== requestId
          ),
        });

        // Remove the declined request from the sender's friendRequests array
        await updateDoc(senderRef, {
          friendRequests: senderData.friendRequests.filter(
            (request) => request.id !== requestId
          ),
        });

        alert("Friend request declined.");
      } else {
        alert("User not found.");
      }
    } catch (error) {
      console.error("Error declining friend request:", error);
      alert("Failed to decline friend request.");
    }
  };

  const handleCancelSentRequest = async (requestId, receiverId) => {
    try {
      console.log("Receiver ID:", receiverId);

      const userRef = doc(db, "users", user.uid);
      const receiverRef = doc(db, "users", receiverId);

      const userSnapshot = await getDoc(userRef);
      const receiverSnapshot = await getDoc(receiverRef);

      if (userSnapshot.exists() && receiverSnapshot.exists()) {
        const userData = userSnapshot.data();
        const receiverData = receiverSnapshot.data();

        console.log("User Data:", userData);
        console.log("Receiver Data:", receiverData);

        if (userData.friendRequests && receiverData.friendRequests) {
          // Filter and update the sender's and receiver's friendRequests arrays
          const updatedUserRequests = userData.friendRequests.filter(
            (request) => request.id !== requestId
          );
          const updatedReceiverRequests = receiverData.friendRequests.filter(
            (request) => request.id !== requestId
          );

          console.log("Updated User Requests:", updatedUserRequests);
          console.log("Updated Receiver Requests:", updatedReceiverRequests);

          // Update the documents
          await updateDoc(userRef, { friendRequests: updatedUserRequests });
          await updateDoc(receiverRef, { friendRequests: updatedReceiverRequests });

          alert("Friend request canceled.");
        } else {
          alert("Friend requests field is missing or empty.");
        }
      } else {
        alert("User or receiver not found.");
      }
    } catch (error) {
      console.error("Error canceling friend request:", error);
      alert("Failed to cancel friend request.");
    }
  };

  return (
    <div className="profile-page">
      <h1>{profileData?.username}'s Profile</h1>
      <p>Email: {profileData?.email}</p>

      {/* If it's the logged-in user's profile */}
      {user?.uid === profileData?.uid ? (
        <>
          <button>Edit Profile</button>
          <Button variant="primary" onClick={handleFriendsShow}>View Friends</Button>
        </>
      ) : (
        <>
          <button onClick={handleAddFriend} disabled={friendRequestSent}>Add Friend</button>
          <Button variant="primary" onClick={handleFriendsShow}>View Friends</Button>
        </>
      )}

      {/* Friend Requests Section */}
      {user?.uid === profileData?.uid && (
        <div>
          <h3>Friend Requests</h3>
          <ListGroup>
            {/* Received Requests */}
            {friendRequests.received.map((request) => (
              <ListGroup.Item key={`${request.senderId}_${request.receiverId}`}>
                <span>{request.senderUsername} wants to be your friend.</span>
                <Button variant="success" onClick={() => handleAcceptFriendRequest(request.id, request.senderId)}>Accept</Button>
                <Button variant="danger" onClick={() => handleDeclineFriendRequest(request.id, request.senderId)}>Decline</Button>
              </ListGroup.Item>
            ))}

            {/* Sent Requests */}
            {friendRequests.sent.map((request) => (
              <ListGroup.Item key={`${request.senderId}_${request.receiverId}`}>
                <span>Friend request to {request.receiverUsername} is pending.</span>
                <Button variant="danger" onClick={() => handleCancelSentRequest(request.id, request.receiverId)}>
                  Cancel Request
                </Button>
              </ListGroup.Item>

            ))}
          </ListGroup>
        </div>
      )}

      {/* Modal to display friends */}
      {profileData?.uid && (
        <FriendsModal show={showFriends} onHide={handleFriendsClose} userId={profileData?.uid} />
      )}
    </div>
  );
};

export default ProfilePage;