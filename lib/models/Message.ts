import mongoose from 'mongoose';

const MessageSchema = new mongoose.Schema({
  projectId: {
    type: String,
    required: true
  },
  user: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.models.Message || mongoose.model('Message');