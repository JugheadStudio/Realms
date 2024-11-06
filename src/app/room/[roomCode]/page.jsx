'use client';

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { db } from "../../firebase/config"; 
import { doc, getDoc } from "firebase/firestore";

export default function ChatLayout({ params }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [roomData, setRoomData] = useState(null);
  const [isIntroGenerated, setIsIntroGenerated] = useState(false); 

  useEffect(() => {
    const fetchRoomData = async () => {
      try {
        const roomRef = doc(db, "rooms", params.roomCode);
        const roomSnapshot = await getDoc(roomRef);
        
        if (roomSnapshot.exists()) {
          const data = roomSnapshot.data();
          setRoomData(data);
          console.log("Room data fetched:", data);

          // Only generate the intro message if it hasn't been generated yet
          if (!isIntroGenerated) {
            await generateIntroMessage(data);
          }
        }
      } catch (error) {
        console.error("Error fetching room data:", error);
      }
    };

    fetchRoomData();
  }, [params.roomCode, isIntroGenerated]);

  const generateIntroMessage = async (data) => {
    const prompt = `You are a creative dungeon master. Introduce the adventure for a character named ${data.characterName}, a ${data.characterType} in ${data.adventureSetting}. Context: ${data.context || 'No specific context provided.'}`;

    try {
      const response = await axios.post('/api/openai', {
        message: prompt,
      });
      const initialMessage = response.data.content;
      setMessages(prevMessages => [
        {
          role: "system",
          content: initialMessage,
        },
        ...prevMessages
      ]);
      setIsIntroGenerated(true);
    } catch (error) {
      console.error('Error fetching OpenAI introduction:', error);
      setMessages(prevMessages => [
        {
          role: "system",
          content: "Welcome to your adventure!",
        },
        ...prevMessages
      ]);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (input.trim() === "") return;

    const userMessage = { role: 'user', content: input };
    setMessages(prevMessages => [...prevMessages, userMessage]);
    setInput("");

    try {
      const response = await axios.post('/api/openai', {
        message: input,
        roomData,
      });

      const botMessage = response.data;
      setMessages(prevMessages => [...prevMessages, botMessage]);
    } catch (error) {
      console.error('Error fetching OpenAI response:', error.response ? error.response.data : error);
    }
  };

  return (
    <div className="flex flex-col h-100">
      <div className="flex-grow p-6 overflow-y-auto">
        <div className="flex flex-col space-y-4">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`p-4 rounded-lg ${message.role === 'user' ? 'bg-blue-500 text-white self-end' : 'bg-gray-300 self-start'}`}
            >
              <strong>{message.role === 'user' ? 'You' : 'Dungeon Master'}:</strong> {message.content}
            </div>
          ))}
        </div>
      </div>
      <form className="p-4 flex" onSubmit={handleSendMessage}>
        <input
          className="flex-grow p-2 border rounded-lg focus:outline-none focus:ring focus:ring-blue-400"
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
