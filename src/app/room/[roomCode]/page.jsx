'use client';

import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { db } from "../../firebase/config";
import { doc, getDoc, updateDoc, arrayUnion, onSnapshot } from "firebase/firestore";
import { getAuth } from "firebase/auth";

export default function ChatLayout({ params }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [roomData, setRoomData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [usernames, setUsernames] = useState({}); 
  const introGeneratedRef = useRef(false);

  useEffect(() => {
    const fetchRoomData = async () => {
      try {
        const roomRef = doc(db, "rooms", params.roomCode);
        const roomSnapshot = await getDoc(roomRef);

        if (roomSnapshot.exists()) {
          const data = roomSnapshot.data();
          setRoomData(data);
          setMessages(data.messages || []);
          
          // Check if intro message hasn't been generated yet and room is loading for the first time
          if (!data.messages || data.messages.length === 0) {
            generateIntroMessage(data);
          }
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

  useEffect(() => {
    if (!params.roomCode) return;

    // Real-time listener to track changes in the room's messages
    const roomRef = doc(db, "rooms", params.roomCode);
    const unsubscribe = onSnapshot(roomRef, (roomSnapshot) => {
      if (roomSnapshot.exists()) {
        const data = roomSnapshot.data();
        setMessages(data.messages || []);
      }
    });

    // Cleanup the listener when the component is unmounted
    return () => unsubscribe();
  }, [params.roomCode]);

  // Function to generate an intro message for the adventure
  const generateIntroMessage = async (data) => {
    if (loading || introGeneratedRef.current) return; // Prevent generating intro if loading or already generated

    setLoading(true); // Set loading to true while generating message
    introGeneratedRef.current = true; // Mark intro as generated

    const playerDetails = data.players.map(player => `${player.username} (Character: ${player.characterName}, Class: ${player.characterClass})`).join(", ");
    const prompt = `
      You are a creative dungeon master. Introduce the adventure for the following players:
      ${playerDetails}. 
      World: ${data.adventureSetting}, 
      Context: ${data.context || 'No specific context provided.'}
    `;

    try {
      const response = await axios.post('/api/openai', { message: prompt });
      const introMessage = response.data.content;

      // Store the intro message in Firestore if generated
      await updateDoc(doc(db, "rooms", params.roomCode), {
        messages: arrayUnion({
          role: "system",
          content: introMessage,
          timestamp: new Date().toISOString()
        })
      });

      // Add intro message to local state
      setMessages(prevMessages => [
        { role: "system", content: introMessage, timestamp: new Date().toISOString() },
        ...prevMessages
      ]);
    } catch (error) {
      console.error('Error generating introduction:', error);
      setMessages(prevMessages => [
        { role: "system", content: "Welcome to your adventure!", timestamp: new Date().toISOString() },
        ...prevMessages
      ]);
    } finally {
      setLoading(false); // Reset loading state after request completes
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (input.trim() === "") return;

    if (!roomData) {
      console.error("Room data is not available.");
      return;
    }

    const user = getAuth().currentUser;

    if (!user) {
      console.error("No user is logged in.");
      return;
    }

    try {
      const userDoc = await getDoc(doc(db, "users", user.uid));
      const username = userDoc.exists() ? userDoc.data().username : "Anonymous";

      const currentPlayer = roomData.players.find(player => player.userId === user.uid);
      if (!currentPlayer) {
        console.error("Player not found in the room.");
        return;
      }

      const userMessage = {
        userId: user.uid,
        content: input,
        role: "user",
        timestamp: new Date().toISOString()
      };

      setMessages(prevMessages => [...prevMessages, { ...userMessage, username }]);
      setInput("");

      const response = await axios.post('/api/openai', {
        message: input,
        roomData
      });

      const botMessage = response.data;
      setMessages(prevMessages => [...prevMessages, botMessage]);

      await saveMessagesToDatabase(userMessage, botMessage);
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const saveMessagesToDatabase = async (userMessage, botMessage) => {
    try {
      const roomRef = doc(db, "rooms", params.roomCode);
      const roomSnapshot = await getDoc(roomRef);
      if (!roomSnapshot.exists()) {
        console.error("Room does not exist");
        return;
      }

      const roomData = roomSnapshot.data();
      const updatedMessages = [
        ...roomData.messages,
        { ...userMessage, role: "user" },
        { ...botMessage, role: "system" }
      ];

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
