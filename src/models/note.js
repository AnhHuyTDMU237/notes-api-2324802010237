const mongoose = require('mongoose');

const noteSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    content: { type: String, default: '' },
    tags: { type: [String], default: [] },
    attachments: [{
      fileName: String,
      fileUrl: String,
      storagePath: String,
      contentType: String,
      size: Number
    }],
    owner: { type: String, required: true, index: true }
  },
  { timestamps: true }
);

noteSchema.index({ tags: 1 });
noteSchema.index({ owner: 1, createdAt: -1 });

module.exports = mongoose.model('Note', noteSchema);
