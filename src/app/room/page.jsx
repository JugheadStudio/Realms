'use client'; 

import React, { useState } from 'react';
import axios from 'axios';

import { useAuthProtection } from "../../hooks/useAuthProtection";

export default function ChatLayout() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");

  useAuthProtection();

  const handleSendMessage = async (e) => {
    e.preventDefault();

    if (input.trim() === "") return;

    const userMessage = { role: 'user', content: input };
    setMessages([...messages, userMessage]);
    setInput("");

    try {
      const response = await axios.post('/api/openai', {
        message: input,
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