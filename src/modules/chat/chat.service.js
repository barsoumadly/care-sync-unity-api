const socketIO = require('socket.io');
const Chat = require('../../models/Chat');

class ChatService {
  constructor(server) {
    this.io = socketIO(server, {
      cors: {
        origin: '*',
        methods: ['GET', 'POST']
      },
      pingTimeout: 60000
    });

    this.io.on('connection', this.handleConnection.bind(this));
  }

  handleConnection(socket) {
    socket.on('join', async (userId) => {
      socket.userId = userId;
      socket.join(userId);
    });

    socket.on('joinChat', async (chatId) => {
      socket.join(chatId);
    });

    socket.on('message', async (data) => {
      try {
        const { chatId, content, type = 'text' } = data;
        const message = {
          sender: socket.userId,
          content,
          type,
          createdAt: new Date()
        };

        // Save message to database
        const chat = await Chat.findByIdAndUpdate(
          chatId,
          {
            $push: { messages: message },
            $set: { lastMessage: message, updatedAt: new Date() }
          },
          { new: true }
        ).populate('participants', 'firstName lastName');

        // Broadcast message to all participants
        this.io.to(chatId).emit('message', {
          chatId,
          message: {
            ...message,
            sender: {
              id: socket.userId,
              firstName: chat.participants.find(p => p._id.toString() === socket.userId)?.firstName,
              lastName: chat.participants.find(p => p._id.toString() === socket.userId)?.lastName
            }
          }
        });
      } catch (error) {
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    socket.on('disconnect', () => {
      if (socket.userId) {
        socket.leave(socket.userId);
      }
    });
  }

  // Method to initialize chat service
  static init(server) {
    return new ChatService(server);
  }

  // Method to get chat history
  static async getChatHistory(chatId, limit = 50, skip = 0) {
    return Chat.findById(chatId)
      .select('messages')
      .slice('messages', [skip, limit])
      .populate('messages.sender', 'firstName lastName');
  }
}

module.exports = ChatService;