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
      socket.emit("leaveChat", chatId);
    };
  }, [socket, connected, chatId, userId]);

  const sendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    socket.emit("sendMessage", {
      chatId,
      content: newMessage,
    });

    setNewMessage("");
  };

  return (
    <div className="chat-container">
      <div className="messages">
        {messages.map((msg, index) => (
          <div key={index} className="message">
            {msg.content}
          </div>
        ))}
      </div>
      <form onSubmit={sendMessage}>
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

## API Integration

### Creating a Chat

```javascript
const createChat = async (participants, type) => {
  try {
    const response = await fetch('YOUR_API_URL/api/v1/chats', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${yourAuthToken}`
      },
      body: JSON.stringify({ participants, type })
    });
    return await response.json();
  } catch (error) {
    console.error('Error creating chat:', error);
  }
};
```

### Retrieving Chat History

```javascript
const getChatHistory = async (chatId, limit = 50, skip = 0) => {
  try {
    const response = await fetch(
      `YOUR_API_URL/api/v1/chats/${chatId}/history?limit=${limit}&skip=${skip}`,
      {
        headers: {
          'Authorization': `Bearer ${yourAuthToken}`
        }
      }
    );
    return await response.json();
  } catch (error) {
    console.error('Error fetching chat history:', error);
  }
};
```

### Retrieving User's Chats

```javascript
const getUserChats = async (limit = 20, skip = 0) => {
  try {
    const response = await fetch(
      `YOUR_API_URL/api/v1/chats?limit=${limit}&skip=${skip}`,
      {
        headers: {
          'Authorization': `Bearer ${yourAuthToken}`
        }
      }
    );
    return await response.json();
  } catch (error) {
    console.error('Error fetching user chats:', error);
  }
};
```

## Error Handling

Implement proper error handling for all chat operations:

```javascript
const handleChatError = (error) => {
  if (error.response) {
    // Handle specific HTTP error responses
    switch (error.response.status) {
      case 404:
        console.error('Chat not found');
        break;
      case 403:
        console.error('Unauthorized access to chat');
        break;
      default:
        console.error('Chat operation failed:', error.message);
    }
  } else {
    // Handle network errors
    console.error('Network error:', error.message);
  }
};
```

## Best Practices

1. **State Management**
   - Use appropriate state management solutions (Redux, Context) for chat data
   - Implement proper caching mechanisms for chat history

2. **Real-time Updates**
   - Handle socket reconnection gracefully
   - Implement message delivery confirmation
   - Show typing indicators

3. **User Experience**
   - Implement message read receipts
   - Show online/offline status
   - Provide message delivery status

4. **Performance**
   - Implement pagination for chat history and user's chat list
   - Use proper cleanup for socket listeners
   - Optimize message rendering for large chat histories
