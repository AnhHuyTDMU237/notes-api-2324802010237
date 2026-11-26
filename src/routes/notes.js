const express = require('express');
const multer = require('multer');
const path = require('path');
const crypto = require('crypto');

const Note = require('../models/note');
const { uploadFile } = require('../storage');
const requireAuth = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024 }
});

router.get('/', async (req, res, next) => {
  try {
    const filter = { owner: req.user.sub };
    if (req.query.tag) filter.tags = String(req.query.tag);
    const notes = await Note.find(filter).sort({ createdAt: -1 });
    res.json(notes);
  } catch (error) { next(error); }
});

router.get('/:id', async (req, res, next) => {
  try {
    const note = await Note.findOne({ _id: req.params.id, owner: req.user.sub });
    if (!note) return res.status(404).json({ message: 'Không tìm thấy ghi chú' });
    res.json(note);
  } catch (error) { next(error); }
});

router.post('/', async (req, res, next) => {
  try {
    const { title, content, tags } = req.body;
    if (typeof title !== 'string' || !title.trim()) {
      return res.status(400).json({ message: 'Tiêu đề không được để trống' });
    }
    const note = await Note.create({
      title: title.trim(),
      content: typeof content === 'string' ? content : '',
      tags: Array.isArray(tags) ? tags.filter(tag => typeof tag === 'string') : [],
      owner: req.user.sub
    });
    res.status(201).json(note);
  } catch (error) { next(error); }
});

router.put('/:id', async (req, res, next) => {
  try {
    const { title, content, tags } = req.body;
    const update = {};
    if (title !== undefined) update.title = title;
    if (content !== undefined) update.content = content;
    if (tags !== undefined) update.tags = tags;
    const note = await Note.findOneAndUpdate(
      { _id: req.params.id, owner: req.user.sub },
      update,
      { new: true, runValidators: true }
    );
    if (!note) return res.status(404).json({ message: 'Không tìm thấy ghi chú' });
    res.json(note);
  } catch (error) { next(error); }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const note = await Note.findOneAndDelete({ _id: req.params.id, owner: req.user.sub });
    if (!note) return res.status(404).json({ message: 'Không tìm thấy ghi chú' });
    res.json({ message: 'Đã xóa ghi chú' });
  } catch (error) { next(error); }
});

router.post('/:id/attachments', upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'Chưa chọn file' });
    const note = await Note.findOne({ _id: req.params.id, owner: req.user.sub });
    if (!note) return res.status(404).json({ message: 'Không tìm thấy ghi chú' });

    const originalName = path.basename(req.file.originalname);
    const safeName = originalName.normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^\w.-]/g, '_');
    const objectPath = `${note._id}/${crypto.randomUUID()}-${safeName}`;
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
    res.status(201).json({ message: 'Upload thành công', attachment });
  } catch (error) { next(error); }
});

module.exports = router;
