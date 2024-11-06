'use client';

import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { db } from "../../firebase/config";
import { doc, getDoc, updateDoc, arrayUnion } from "firebase/firestore";
import { getAuth } from "firebase/auth";  // Import Firebase Auth to get the current user

export default function ChatLayout({ params }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [roomData, setRoomData] = useState(null);
  const [usernames, setUsernames] = useState({}); // Store usernames by userId
  const introGeneratedRef = useRef(false); // Use useRef to track intro generation

  useEffect(() => {
    const fetchRoomData = async () => {
      try {
        const roomRef = doc(db, "rooms", params.roomCode);
        const roomSnapshot = await getDoc(roomRef);

        if (roomSnapshot.exists()) {
          const data = roomSnapshot.data();
          setRoomData(data);

          // If the room has messages, load them into the state
          setMessages(data.messages || []);
        }
      } catch (error) {
        console.error("Error fetching room data:", error);
      }
    };

    fetchRoomData();
  }, [params.roomCode]);

  useEffect(() => {
    // Fetch usernames for all players in the room when the roomData is loaded
    if (roomData) {
      const fetchUsernames = async () => {
        const usernamesMap = {};
        for (let player of roomData.players) {
          try {
            const userDoc = await getDoc(doc(db, "users", player.userId));
            if (userDoc.exists()) {
              usernamesMap[player.userId] = userDoc.data().username;
            }
          } catch (error) {
            console.error("Error fetching username:", error);
          }
        }
        setUsernames(usernamesMap);
      };

      fetchUsernames();
    }
  }, [roomData]);

  const generateIntroMessage = async (data) => {
    const prompt = `You are a creative dungeon master. Introduce the adventure for the following players: ${data.players.map(player => player.username).join(", ")}. World: ${data.adventureSetting}, Context: ${data.context || 'No specific context provided.'}`;

    try {
      const response = await axios.post('/api/openai', {
        message: prompt,
      });
      const initialMessage = response.data.content;

      // Store intro message in Firestore
      await updateDoc(doc(db, "rooms", params.roomCode), {
        messages: arrayUnion({
          role: "system",
          content: initialMessage,
          timestamp: new Date().toISOString()
        })
      });

      setMessages(prevMessages => [
        { role: "system", content: initialMessage, timestamp: new Date().toISOString() },
        ...prevMessages
      ]);
    } catch (error) {
      console.error('Error fetching OpenAI introduction:', error);
      setMessages(prevMessages => [
        { role: "system", content: "Welcome to your adventure!", timestamp: new Date().toISOString() },
        ...prevMessages
      ]);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (input.trim() === "") return;

    // Check if roomData exists before accessing players
    if (!roomData) {
      console.error("Room data is not available.");
      return;
    }

    // Get the current logged-in user from Firebase Auth
    const user = getAuth().currentUser;

    if (!user) {
      console.error("No user is logged in.");
      return;
    }

    try {
      // Fetch the user document from Firestore using the current user's UID
      const userDoc = await getDoc(doc(db, "users", user.uid));
      const username = userDoc.exists() ? userDoc.data().username : "Anonymous";

      // Find the current player in the room data using userId
      const currentPlayer = roomData.players.find(player => player.userId === user.uid);
      if (!currentPlayer) {
        console.error("Player not found in the room.");
        return;
      }

      // Construct the user message with the role "user"
      const userMessage = {
        userId: user.uid,  // Save user ID
        content: input,
        role: "user",       // Add role as 'user'
        timestamp: new Date().toISOString()
      };

      // Update messages state
      setMessages(prevMessages => [...prevMessages, { ...userMessage, username }]);
      setInput("");

      // Send the user's message to OpenAI (optional)
      const response = await axios.post('/api/openai', {
        message: input,
        roomData
      });

      const botMessage = response.data;
      setMessages(prevMessages => [...prevMessages, botMessage]);

      // Save the user and bot messages to Firestore
      await saveMessagesToDatabase(userMessage, botMessage);
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  // Function to save the messages to Firestore
  const saveMessagesToDatabase = async (userMessage, botMessage) => {
    try {
      // Update the room document with the new messages
      const roomRef = doc(db, "rooms", params.roomCode);

      // Get the current room data
      const roomSnapshot = await getDoc(roomRef);
      if (!roomSnapshot.exists()) {
        console.error("Room does not exist");
        return;
      }

      const roomData = roomSnapshot.data();

      // Ensure that both user and bot messages have a role (user and system respectively)
      const updatedMessages = [
        ...roomData.messages,  // Previous messages
        { ...userMessage, role: "user" },  // User message with role
        { ...botMessage, role: "system" }  // Bot message with role
      ];

      // Update the Firestore document
      await updateDoc(roomRef, {
        messages: updatedMessages
      });
    } catch (error) {
      console.error("Error saving messages to Firestore:", error);
    }
  };

  return (
    <div className="flex flex-col h-100">
      <div className="flex-grow p-6 overflow-y-auto">
        {messages.length === 0 ? (
          <p>No messages yet...</p>
        ) : (
          <div className="flex flex-col space-y-4">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`p-4 rounded-lg ${message.role === 'user' ? 'bg-blue-500 text-white self-end' : 'bg-gray-300 self-start'}`}
              >
                <strong>{message.role === 'user' ? usernames[message.userId] || 'Unknown User' : 'Dungeon Master'}:</strong> {message.content}
              </div>
            ))}
          </div>
        )}
      </div>
      <form className="p-4 flex" onSubmit={handleSendMessage}>
        <input
          className="flex-grow p-2 border text-black rounded-lg focus:outline-none focus:ring focus:ring-blue-400"
          type="text"
          value={input}
          placeholder="Type your message..."
          onChange={(e) => setInput(e.target.value)}
        />
        <button
          type="submit"
          className="ml-4 bg-blue-500 text-white px-4 py-2 rounded-lg"
        >
          Send
        </button>
      </form>
    </div>
  );
}
