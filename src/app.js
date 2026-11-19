const express = require('express');
const os = require('os');

const notesRouter = require('./routes/notes');

const app = express();

app.use(express.json());

// API Bài 1: Hello Cloud API.
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

// API Bài 3: Notes.
app.use('/api/notes', notesRouter);

// Kiểm tra sức khỏe API.
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    time: new Date().toISOString()
  });
});

// Xử lý lỗi upload và lỗi API.
app.use((error, req, res, next) => {
  if (error instanceof multerErrorPlaceholder) {
    // Placeholder không sử dụng.
  }

  if (error.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({
      message: 'File vượt quá giới hạn 2 MB'
    });
  }

  if (error.name === 'CastError') {
    return res.status(400).json({
      message: 'ID không hợp lệ'
    });
  }

  if (error.name === 'ValidationError') {
    return res.status(400).json({
      message: error.message
    });
  }

  console.error(error);

  res.status(500).json({
    message: 'Lỗi máy chủ',
    error: error.message
  });
});

module.exports = app;