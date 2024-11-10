'use client';

import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { db } from "../../firebase/config";
import { doc, getDoc, updateDoc, arrayUnion, onSnapshot } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import MarkdownIt from "markdown-it";

export default function ChatLayout({ params }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [roomData, setRoomData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [usernames, setUsernames] = useState({});
  const introGeneratedRef = useRef(false);
  const md = new MarkdownIt();

  useEffect(() => {
    const fetchRoomData = async () => {
      try {
        const roomRef = doc(db, "rooms", params.roomCode);
        const roomSnapshot = await getDoc(roomRef);

        if (roomSnapshot.exists()) {
          const data = roomSnapshot.data();
          setRoomData(data);
          setMessages(data.messages || []);
        }
      } catch (error) {
        console.error("Error fetching room data:", error);
      }
    };

    fetchRoomData();
  }, [params.roomCode]);

  useEffect(() => {
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

    const roomRef = doc(db, "rooms", params.roomCode);
    const unsubscribe = onSnapshot(roomRef, (roomSnapshot) => {
      if (roomSnapshot.exists()) {
        const data = roomSnapshot.data();
        setMessages(data.messages || []);
      }
    });

    return () => unsubscribe();
  }, [params.roomCode]);

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
        timestamp: new Date().toISOString(),
        username,
      };

      setMessages(prevMessages => [...prevMessages, { ...userMessage, username }]);
      setInput("");

      const response = await axios.post('/api/openai', {
        message: input,
        roomData
      });

      const botMessage = response.data;
      setMessages(prevMessages => [...prevMessages, botMessage]);

      await saveMessagesToDatabase(userMessage, botMessage, currentPlayer.characterName);
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const saveMessagesToDatabase = async (userMessage, botMessage, characterName) => {
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
        { ...userMessage, role: "user", characterName },
        { ...botMessage, role: "system" }
      ];

      await updateDoc(roomRef, {
        messages: updatedMessages,
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
              <div key={index} className={`p-4 rounded-lg ${message.role === 'user' ? 'bg-blue-500 text-white self-end' : 'bg-gray-800 self-start'}`}>
                <strong>
                  {message.characterName ? `${message.characterName} (${message.username || 'Unknown User'})` : 'Dungeon Master'}:
                </strong>
                {/* Render markdown content as HTML */}
                <div
                  dangerouslySetInnerHTML={{ __html: md.render(message.content) }}
                  className="markdown-content"
                />

              </div>
            ))}
          </div>
        )}
      </div>
      <form className="p-4 flex" onSubmit={handleSendMessage}>
        <input className="flex-grow p-2 border text-black rounded-lg focus:outline-none focus:ring focus:ring-blue-400" type="text" value={input} placeholder="Type your message..." onChange={(e) => setInput(e.target.value)} />
        <button type="submit" className="ml-4 bg-blue-500 text-white px-4 py-2 rounded-lg">
          Send
        </button>
      </form>
    </div>
  );
}
