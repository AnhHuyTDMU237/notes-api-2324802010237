const express = require('express');
const os = require('os');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoose = require('mongoose');

const notesRouter = require('./routes/notes');
const authRouter = require('./routes/auth');

mongoose.set('sanitizeFilter', true);

const app = express();
app.set('trust proxy', 1);
app.use(helmet());
app.use(express.json({ limit: '100kb' }));

app.get('/', (req, res) => {
  res.json({
    message: 'Xin chào từ đám mây!',
    host: os.hostname(),
    platform: `${os.type()} ${os.release()}`,
    cpus: os.cpus().length,
    memoryGB: Number((os.totalmem() / 1024 ** 3).toFixed(1)),
    uptimeSec: Math.round(os.uptime()),
    time: new Date().toISOString()
  });
});

app.use('/auth', rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { error: 'Quá nhiều lần đăng nhập/đăng ký. Thử lại sau 15 phút.' }
}), authRouter);

app.use('/api/notes', notesRouter);

app.get('/health', (req, res) => {
  res.json({ status: 'OK', time: new Date().toISOString() });
});

app.use((error, req, res, next) => {
  if (error.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ message: 'File vượt quá giới hạn 2 MB' });
  }
  if (error.name === 'CastError') {
    return res.status(400).json({ message: 'ID không hợp lệ' });
  }
  if (error.name === 'ValidationError') {
    return res.status(400).json({ message: error.message });
  }
  console.error(error);
  res.status(500).json({ message: 'Lỗi máy chủ' });
});

module.exports = app;
