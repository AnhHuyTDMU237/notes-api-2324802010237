require('dotenv').config();

const mongoose = require('mongoose');
const connectDB = require('../src/db');
const Note = require('../src/models/note');

async function seed() {
  try {
    await connectDB();

    await Note.deleteMany({ owner: 'seed' });

    const tags = [
      'docker',
      'mongodb',
      'nodejs',
      'cloud',
      'database',
      'api',
      'storage'
    ];

    const documents = [];

    for (let i = 1; i <= 2000; i++) {
      documents.push({
        title: `Ghi chú thử nghiệm ${i}`,
        content: `Dữ liệu mẫu phục vụ kiểm tra chỉ mục số ${i}`,
        tags: [
          tags[i % tags.length],
          tags[(i + 3) % tags.length]
        ],
        owner: 'seed'
      });
    }

    await Note.insertMany(documents);
    await Note.syncIndexes();

    const count = await Note.countDocuments({
      owner: 'seed'
    });

    console.log(`Đã tạo ${count} tài liệu mẫu.`);
  } catch (error) {
    console.error('Lỗi seed dữ liệu:', error);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}

seed();