# Chat Integration Guide for React.js

This guide explains how to integrate the Care Sync Unity chat functionality into your React application using WebSocket (Socket.IO). The chat system uses a dual-reference system for optimized chat retrieval and proper indexing setup.

## Installation

First, install the required dependencies:

```bash
npm install socket.io-client
```

## Chat System Architecture

The chat system uses a dual-reference architecture where:

- Chat messages are stored in a dedicated collection
- User documents maintain references to their active chats
- Proper indexing is set up for optimal query performance

## Socket Context Setup

Create a context to manage the WebSocket connection across your React components:

```javascript
// src/contexts/SocketContext.jsx
import React, { createContext, useContext, useEffect, useState } from "react";
import { io } from "socket.io-client";

const SocketContext = createContext();

export function SocketProvider({ children }) {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    // Initialize socket connection
    const socketInstance = io("YOUR_SERVER_URL", {
      transports: ["websocket"],
      autoConnect: true,
    });

    // Set up event listeners
    socketInstance.on("connect", () => {
      setConnected(true);
      console.log("Connected to chat server");
    });

    socketInstance.on("connect_error", (error) => {
      console.error("Connection failed:", error);
      setConnected(false);
    });

    setSocket(socketInstance);

    // Cleanup on unmount
    return () => {
      socketInstance.disconnect();
    };
  }, []);

  return (
    <SocketContext.Provider value={{ socket, connected }}>
      {children}
    </SocketContext.Provider>
  );
}

export const useSocket = () => useContext(SocketContext);
```

## Chat Component Implementation

Create a React component to handle chat functionality:

```javascript
// src/components/Chat.jsx
import React, { useEffect, useState } from "react";
import { useSocket } from "../contexts/SocketContext";

function Chat({ chatId, userId }) {
  const { socket, connected } = useSocket();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");

  useEffect(() => {
    if (!socket || !connected) return;

    // Join user's personal room
    socket.emit("join", userId);

    // Join specific chat room
    socket.emit("joinChat", chatId);

    // Listen for new messages
    socket.on("message", (data) => {
      setMessages((prev) => [...prev, data.message]);
    });

    // Listen for errors
    socket.on("error", (error) => {
      console.error("Chat error:", error);
    });

    // Cleanup listeners on unmount
    return () => {
      socket.off("message");
      socket.off("error");
    };
  }, [socket, connected, chatId, userId]);

  const sendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !socket) return;

    socket.emit("message", {
      chatId,
      content: newMessage,
      type: "text",
    });

    setNewMessage("");
  };

  return (
    <div className="chat-container">
      <div className="messages-container">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`message ${
              message.sender.id === userId ? "sent" : "received"
            }`}
          >
            <p>{message.content}</p>
            <small>
              {message.sender.firstName} {message.sender.lastName}
            </small>
          </div>
        ))}
      </div>
      <form onSubmit={sendMessage} className="message-form">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type a message..."
        />
        <button type="submit">Send</button>
      </form>
    </div>
  );
}

export default Chat;
```

## App Setup

Wrap your app with the SocketProvider:

```javascript
// src/App.jsx
import { SocketProvider } from "./contexts/SocketContext";

function App() {
  return <SocketProvider>{/* Your app components */}</SocketProvider>;
}
```

## REST API Integration with React

Create a custom hook for chat API operations:

```javascript
// src/hooks/useChat.jsx
import { useState } from "react";

export function useChat() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const createChat = async (participants, type = "individual") => {
    setLoading(true);
    try {
      const response = await fetch("/api/v1/chats", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ participants, type }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message);
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const getChatHistory = async (chatId, limit = 50, skip = 0) => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/v1/chats/${chatId}/messages?limit=${limit}&skip=${skip}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      const data = await response.json();
      if (!response.ok) throw new Error(data.message);
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    createChat,
    getChatHistory,
    loading,
    error,
  };
}
```

## Usage Example

Here's how to use the chat functionality in a component:

```javascript
// src/components/ChatRoom.jsx
import React, { useEffect, useState } from "react";
import { useChat } from "../hooks/useChat";
import Chat from "./Chat";

function ChatRoom({ userId, otherUserId }) {
  const { createChat, loading, error } = useChat();
  const [chatId, setChatId] = useState(null);

  useEffect(() => {
    const initializeChat = async () => {
      try {
        const { data } = await createChat([otherUserId], "individual");
        setChatId(data._id);
      } catch (err) {
        console.error("Failed to create chat:", err);
      }
    };

    initializeChat();
  }, [otherUserId]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!chatId) return null;

  return <Chat chatId={chatId} userId={userId} />;
}

export default ChatRoom;
```

This implementation provides a complete React-based chat solution with real-time messaging, proper component lifecycle management, and error handling. The SocketContext ensures that the WebSocket connection is managed efficiently across your application, while the useChat hook provides a clean interface for REST API operations.
