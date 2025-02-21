# Simple Chat Integration Guide

[Previous content remains unchanged...]

## React.js Implementation Guide

### 1. Basic Setup

```javascript
// src/services/chatService.js
import io from 'socket.io-client';

let socket = null;

export const initSocket = (token) => {
  if (!socket) {
    socket = io('http://localhost:3000/api/v1', {
      auth: { token }
    });
  }
  return socket;
};

export const getSocket = () => socket;

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
```

### 2. Chat Context

```javascript
// src/context/ChatContext.js
import { createContext, useContext, useState, useEffect } from 'react';
import { initSocket, getSocket, disconnectSocket } from '../services/chatService';

const ChatContext = createContext();

export const ChatProvider = ({ children }) => {
  const [chats, setChats] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const socket = initSocket(token);

    socket.on('connect', () => {
      setError(null);
      loadChats();
    });

    socket.on('error', (error) => {
      setError(error.message);
    });

    socket.on('message:received', handleNewMessage);

    return () => {
      disconnectSocket();
    };
  }, []);

  const loadChats = async () => {
    try {
      const response = await fetch('/api/v1/chats', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      setChats(data.data.chats);
      setLoading(false);
    } catch (err) {
      setError('Failed to load chats');
      setLoading(false);
    }
  };

  const handleNewMessage = ({ chatId, message }) => {
    setChats(prevChats => {
      return prevChats.map(chat => {
        if (chat._id === chatId) {
          return {
            ...chat,
            messages: [...chat.messages, message],
            lastMessage: message
          };
        }
        return chat;
      });
    });

    if (activeChat?._id === chatId) {
      setMessages(prev => [...prev, message]);
    }
  };

  const sendMessage = (content) => {
    if (!activeChat) return;

    const socket = getSocket();
    socket.emit('message:send', {
      chatId: activeChat._id,
      content
    });
  };

  const value = {
    chats,
    activeChat,
    setActiveChat,
    messages,
    loading,
    error,
    sendMessage
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};

export const useChat = () => useContext(ChatContext);
```

### 3. Components

```javascript
// src/components/ChatList.js
import { useChat } from '../context/ChatContext';

export const ChatList = () => {
  const { chats, activeChat, setActiveChat, loading } = useChat();

  if (loading) return <div>Loading chats...</div>;

  return (
    <div>
      {chats.map(chat => (
        <div
          key={chat._id}
          onClick={() => setActiveChat(chat)}
          style={{
            backgroundColor: activeChat?._id === chat._id ? '#e3f2fd' : 'white'
          }}
        >
          {chat.type === 'direct' ? (
            // Show other participant's name for direct chats
            <div>{chat.participants[0]._id === currentUserId ? 
              chat.participants[1].name : chat.participants[0].name}</div>
          ) : (
            // Show group name for group chats
            <div>{chat.name}</div>
          )}
          <div>{chat.lastMessage?.content}</div>
        </div>
      ))}
    </div>
  );
};

// src/components/ChatWindow.js
import { useState } from 'react';
import { useChat } from '../context/ChatContext';

export const ChatWindow = () => {
  const { activeChat, messages, sendMessage } = useChat();
  const [newMessage, setNewMessage] = useState('');

  if (!activeChat) {
    return <div>Select a chat to start messaging</div>;
  }

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    sendMessage(newMessage);
    setNewMessage('');
  };

  return (
    <div>
      <div style={{ height: '400px', overflowY: 'auto' }}>
        {activeChat.messages.map(message => (
          <div
            key={message._id}
            style={{
              marginLeft: message.sender._id === currentUserId ? 'auto' : '0',
              maxWidth: '70%'
            }}
          >
            <div>{message.content}</div>
            <small>{new Date(message.createdAt).toLocaleTimeString()}</small>
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={newMessage}
          onChange={e => setNewMessage(e.target.value)}
          placeholder="Type a message..."
        />
        <button type="submit">Send</button>
      </form>
    </div>
  );
};
```

### 4. Usage

```javascript
// src/App.js
import { ChatProvider } from './context/ChatContext';
import { ChatList } from './components/ChatList';
import { ChatWindow } from './components/ChatWindow';

export const App = () => {
  return (
    <ChatProvider>
      <div style={{ display: 'flex' }}>
        <div style={{ width: '300px' }}>
          <ChatList />
        </div>
        <div style={{ flex: 1 }}>
          <ChatWindow />
        </div>
      </div>
    </ChatProvider>
  );
};
```

### 5. Error Handling Example

```javascript
// Enhanced ChatWindow with error handling
export const ChatWindow = () => {
  const { activeChat, messages, sendMessage, error } = useChat();
  const [newMessage, setNewMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    try {
      await sendMessage(newMessage);
      setNewMessage('');
    } catch (err) {
      if (err.code === 'RATE_LIMIT_EXCEEDED') {
        alert('Please wait before sending more messages');
      } else if (err.code === 'ACCESS_DENIED') {
        alert('You cannot send messages in this chat');
      } else {
        alert('Failed to send message');
      }
    }
  };

  if (error) {
    return <div>Error: {error}</div>;
  }

  // Rest of the component...
};
```

### 6. Typing Indicator Implementation

```javascript
// Enhanced ChatContext
export const ChatProvider = ({ children }) => {
  // ... existing state ...
  const [typingUsers, setTypingUsers] = useState({});

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    socket.on('typing:status', ({ chatId, userId, isTyping }) => {
      setTypingUsers(prev => ({
        ...prev,
        [chatId]: {
          ...prev[chatId],
          [userId]: isTyping
        }
      }));
    });

    return () => socket.off('typing:status');
  }, []);

  const sendTypingStatus = (isTyping) => {
    if (!activeChat) return;

    const socket = getSocket();
    socket.emit(isTyping ? 'typing:start' : 'typing:stop', {
      chatId: activeChat._id
    });
  };

  // Add to value object:
  const value = {
    // ... existing values ...
    typingUsers,
    sendTypingStatus
  };
};

// Enhanced ChatWindow
export const ChatWindow = () => {
  // ... existing code ...

  const handleInputChange = (e) => {
    setNewMessage(e.target.value);
    sendTypingStatus(e.target.value.length > 0);
  };

  return (
    <div>
      {/* ... messages ... */}
      {Object.entries(typingUsers[activeChat._id] || {})
        .filter(([userId, isTyping]) => userId !== currentUserId && isTyping)
        .map(([userId]) => (
          <div key={userId}>
            {activeChat.participants.find(p => p._id === userId)?.name} is typing...
          </div>
        ))}
      <form>
        <input
          value={newMessage}
          onChange={handleInputChange}
          onBlur={() => sendTypingStatus(false)}
        />
      </form>
    </div>
  );
};
```

This implementation provides a complete chat solution with real-time messaging, typing indicators, error handling, and proper cleanup of socket connections.