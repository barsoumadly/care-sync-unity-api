const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    content: {
      type: String,
      required: true,
      trim: true,
      maxLength: 5000, // Reasonable limit for message length
    },
    readBy: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    }],
    attachments: [{
      url: String,
      public_id: String,
      type: {
        type: String,
        enum: ['image', 'document']
      }
    }]
  },
  {
    timestamps: true
  }
);

const chatSchema = new mongoose.Schema(
  {
    participants: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    }],
    messages: [messageSchema],
    type: {
      type: String,
      enum: ['direct', 'group'],
      default: 'direct'
    },
    name: {
      type: String,
      trim: true,
      // Required only for group chats
      required: function() {
        return this.type === 'group';
      }
    },
    admin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      // Required only for group chats
      required: function() {
        return this.type === 'group';
      }
    },
    lastMessage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Message"
    },
    status: {
      type: String,
      enum: ['active', 'archived'],
      default: 'active'
    }
  },
  {
    timestamps: true
  }
);

// Indexes for better query performance
chatSchema.index({ participants: 1 });
chatSchema.index({ status: 1 });
chatSchema.index({ updatedAt: -1 });

// Middleware to populate certain fields
chatSchema.pre(/^find/, function(next) {
  this.populate({
    path: 'participants',
    select: 'name email profilePhoto'
  });
  next();
});

// Static method to check if a chat exists between users
chatSchema.statics.getChatByParticipants = async function(participantIds) {
  return this.findOne({
    participants: { $all: participantIds },
    type: 'direct'
  });
};

// Method to add message to chat
chatSchema.methods.addMessage = async function(messageData) {
  this.messages.push(messageData);
  this.lastMessage = messageData._id;
  await this.save();
  return this;
};

const Chat = mongoose.model("Chat", chatSchema);

module.exports = Chat;
