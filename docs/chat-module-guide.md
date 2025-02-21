# Chat Module Guide

## Overview
The Chat Module provides real-time messaging capabilities with support for both individual and group chats. It integrates with the Care Sync Unity API to enable secure, authenticated communication between users.

## Features
- Individual (one-to-one) chat support
- Group chat functionality
- Real-time message delivery
- Chat history retrieval with pagination
- User's chat list retrieval
- Participant management
- Authentication integration

## Implementation

### Chat Creation

#### Individual Chat
Individual chats are created between exactly two participants. The system automatically checks for existing chats between the same participants to prevent duplicates.

```javascript
// Example: Creating an individual chat
POST /api/v1/chats
{
  "participants": ["userId1"],  // Second participant is automatically added
  "type": "individual"
}
```

#### Group Chat
Group chats can include multiple participants and are created with the 'group' type.

```javascript
// Example: Creating a group chat
POST /api/v1/chats
{
  "participants": ["userId1", "userId2", "userId3"],
  "type": "group"
}
```

### Authentication
All chat operations require authentication using JWT tokens. The token must be included in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

### Chat History
Retrieve chat history with pagination support:

```javascript
GET /api/v1/chats/:chatId/history?limit=50&skip=0
```

Parameters:
- `limit`: Number of messages to retrieve (default: 50)
- `skip`: Number of messages to skip for pagination

### User's Chats
Retrieve all chats where the authenticated user is a participant:

```javascript
GET /api/v1/chats?limit=20&skip=0
```

Parameters:
- `limit`: Number of chats to retrieve (default: 20)
- `skip`: Number of chats to skip for pagination

Response format:
```javascript
{
  "status": "success",
  "data": [
    {
      "_id": "chatId",
      "type": "individual"|"group",
      "participants": [{
        "_id": "userId",
        "name": "User Name",
        "email": "user@example.com"
      }],
      "createdAt": "2023-01-01T00:00:00.000Z",
      "updatedAt": "2023-01-01T00:00:00.000Z"
    }
  ]
}
```

## Real-time Integration

The chat service is initialized with the server instance:

```javascript
// Server initialization
const server = createServer();
ChatService.init(server);
```

## Error Handling

The module implements comprehensive error handling for common scenarios:

- Invalid chat type
- Unauthorized access
- Invalid participant configuration
- Chat not found

Errors are returned with appropriate HTTP status codes and descriptive messages.

## Best Practices

1. **Authentication**
   - Always verify user authentication before any chat operations
   - Validate user participation in chat before allowing access

2. **Performance**
   - Use pagination when retrieving chat history and user's chat list
   - Implement proper cleanup for disconnected sessions
   - Consider caching frequently accessed chat lists

3. **Security**
   - Validate all input parameters
   - Ensure users can only access chats they're participants in
   - Implement rate limiting for message sending

## API Response Format

Successful responses follow a consistent format:

```javascript
{
  "status": "success",
  "data": {} // Response data
}
```

Error responses:

```javascript
{
  "status": "error",
  "message": "Error description"
}
```

## Integration Example

```javascript
// Creating a new chat
const response = await fetch('/api/v1/chats', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    participants: ['userId'],
    type: 'individual'
  })
});

const chat = await response.json();
```

## Troubleshooting

1. **Chat Creation Fails**
   - Verify all participants exist
   - Check participant count matches chat type
   - Ensure authentication token is valid

2. **Cannot Access Chat History**
   - Verify user is a participant
   - Check chat ID is valid
   - Ensure pagination parameters are valid

3. **Real-time Messages Not Received**
   - Check WebSocket connection
   - Verify authentication
   - Ensure proper event handlers are set up