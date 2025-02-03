const mongoose = require("mongoose");

// TODO: Define the schema for the chat model
const chatSchema = mongoose.Schema();

const Chat = mongoose.model("Chat", chatSchema);

module.exports = Chat;
