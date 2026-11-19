const mongoose = require('mongoose');

const noteSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true
    },

    content: {
      type: String,
      default: ''
    },

    tags: {
      type: [String],
      default: []
    },

    attachments: [
      {
        fileName: String,
        fileUrl: String,
        storagePath: String,
        contentType: String,
        size: Number
      }
    ],

    owner: {
      type: String,
      default: 'user'
    }
  },
  {
    timestamps: true
  }
);

// Chỉ mục trên trường tags để tối ưu truy vấn theo tag.
noteSchema.index({ tags: 1 });

module.exports = mongoose.model('Note', noteSchema);