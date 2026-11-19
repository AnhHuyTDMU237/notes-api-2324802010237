require('dotenv').config();

const connectDB = require('./db');
const app = require('./app');

const PORT = process.env.PORT || 3000;

async function startServer() {
  try {
    await connectDB();

    app.listen(PORT, () => {
      console.log(`API đang chạy tại cổng ${PORT}`);
    });
  } catch (error) {
    console.error('Không thể khởi động máy chủ:', error.message);
    process.exit(1);
  }
}

startServer();