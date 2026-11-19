
require('dotenv').config();

const mongoose = require('mongoose');
const connectDB = require('../src/db');
const Note = require('../src/models/note');

async function main() {
  try {
    await connectDB();
    await Note.syncIndexes();

    const filter = {
      owner: 'seed',
      tags: 'docker'
    };

    // Cách 1: buộc quét toàn bộ collection.
    const collectionScan = await Note.find(filter)
      .hint({ $natural: 1 })
      .explain('executionStats');

    // Cách 2: buộc sử dụng chỉ mục tags_1.
    const indexScan = await Note.find(filter)
      .hint({ tags: 1 })
      .explain('executionStats');

    const results = [
      {
        method: 'COLLSCAN',
        docsExamined:
          collectionScan.executionStats.totalDocsExamined,
        keysExamined:
          collectionScan.executionStats.totalKeysExamined,
        nReturned:
          collectionScan.executionStats.nReturned,
        executionTimeMillis:
          collectionScan.executionStats.executionTimeMillis
      },
      {
        method: 'IXSCAN',
        docsExamined:
          indexScan.executionStats.totalDocsExamined,
        keysExamined:
          indexScan.executionStats.totalKeysExamined,
        nReturned:
          indexScan.executionStats.nReturned,
        executionTimeMillis:
          indexScan.executionStats.executionTimeMillis
      }
    ];

    console.log('\nKẾT QUẢ SO SÁNH EXPLAIN');
    console.table(results);
  } catch (error) {
    console.error('Lỗi explain:', error);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}

main();