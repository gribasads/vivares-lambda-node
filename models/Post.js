const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
      content: {
      type: Object,
      required: true
    },
    images: [{
      type: String,
      required: false
    }],
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Post', postSchema); 