const express = require('express');
const multer = require('multer');
const path = require('path');
const crypto = require('crypto');

const Note = require('../models/note');
const { uploadFile } = require('../storage');

const router = express.Router();

const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: {
    fileSize: 2 * 1024 * 1024
  }
});

// GET /api/notes
// Lấy danh sách ghi chú, có thể lọc theo tag.
router.get('/', async (req, res, next) => {
  try {
    const filter = {};

    if (req.query.tag) {
      filter.tags = req.query.tag;
    }

    const notes = await Note.find(filter).sort({
      createdAt: -1
    });

    res.json(notes);
  } catch (error) {
    next(error);
  }
});

// GET /api/notes/:id
// Lấy một ghi chú theo ID.
router.get('/:id', async (req, res, next) => {
  try {
    const note = await Note.findById(req.params.id);

    if (!note) {
      return res.status(404).json({
        message: 'Không tìm thấy ghi chú'
      });
    }

    res.json(note);
  } catch (error) {
    next(error);
  }
});

// POST /api/notes
// Tạo ghi chú.
router.post('/', async (req, res, next) => {
  try {
    const { title, content, tags } = req.body;

    if (!title) {
      return res.status(400).json({
        message: 'Tiêu đề không được để trống'
      });
    }

    const note = await Note.create({
      title,
      content,
      tags: Array.isArray(tags) ? tags : []
    });

    res.status(201).json(note);
  } catch (error) {
    next(error);
  }
});

// PUT /api/notes/:id
// Cập nhật ghi chú.
router.put('/:id', async (req, res, next) => {
  try {
    const { title, content, tags } = req.body;

    const update = {};

    if (title !== undefined) update.title = title;
    if (content !== undefined) update.content = content;
    if (tags !== undefined) update.tags = tags;

    const note = await Note.findByIdAndUpdate(
      req.params.id,
      update,
      {
        new: true,
        runValidators: true
      }
    );

    if (!note) {
      return res.status(404).json({
        message: 'Không tìm thấy ghi chú'
      });
    }

    res.json(note);
  } catch (error) {
    next(error);
  }
});

// DELETE /api/notes/:id
// Xóa ghi chú.
router.delete('/:id', async (req, res, next) => {
  try {
    const note = await Note.findByIdAndDelete(req.params.id);

    if (!note) {
      return res.status(404).json({
        message: 'Không tìm thấy ghi chú'
      });
    }

    res.json({
      message: 'Đã xóa ghi chú'
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/notes/:id/attachments
// Upload file lên Supabase Storage.
router.post(
  '/:id/attachments',
  upload.single('file'),
  async (req, res, next) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          message: 'Chưa chọn file'
        });
      }

      const note = await Note.findById(req.params.id);

      if (!note) {
        return res.status(404).json({
          message: 'Không tìm thấy ghi chú'
        });
      }

      const originalName = path.basename(req.file.originalname);

      const safeName = originalName
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^\w.-]/g, '_');

      const objectPath =
        `${note._id}/${crypto.randomUUID()}-${safeName}`;

      const fileUrl = await uploadFile(req.file, objectPath);

      const attachment = {
        fileName: originalName,
        fileUrl,
        storagePath: objectPath,
        contentType: req.file.mimetype,
        size: req.file.size
      };

      note.attachments.push(attachment);
      await note.save();

      res.status(201).json({
        message: 'Upload thành công',
        attachment
      });
    } catch (error) {
      next(error);
    }
  }
);

module.exports = router;