const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/user');

const router = express.Router();

function readCredentials(body) {
  const { email, password } = body ?? {};
  if (typeof email !== 'string' || typeof password !== 'string') return null;
  const normalizedEmail = email.trim().toLowerCase();
  if (!/^\S+@\S+\.\S+$/.test(normalizedEmail) || password.length < 8) return null;
  return { email: normalizedEmail, password };
}

router.post('/register', async (req, res, next) => {
  try {
    const cred = readCredentials(req.body);
    if (!cred) return res.status(400).json({ error: 'Cần email hợp lệ và mật khẩu từ 8 ký tự' });
    if (await User.exists({ email: cred.email })) {
      return res.status(409).json({ error: 'Email đã được đăng ký' });
    }
    const passwordHash = await bcrypt.hash(cred.password, 10);
    const user = await User.create({ email: cred.email, passwordHash });
    res.status(201).json({ id: user._id, email: user.email });
  } catch (error) {
    if (error.code === 11000) return res.status(409).json({ error: 'Email đã được đăng ký' });
    next(error);
  }
});

router.post('/login', async (req, res, next) => {
  try {
    const cred = readCredentials(req.body);
    const user = cred && await User.findOne({ email: cred.email });
    const ok = user && await bcrypt.compare(cred.password, user.passwordHash);
    if (!ok) return res.status(401).json({ error: 'Sai email hoặc mật khẩu' });
    if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
      return res.status(500).json({ error: 'JWT_SECRET chưa được cấu hình an toàn' });
    }
    const token = jwt.sign(
      { sub: user._id.toString(), email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '1h', algorithm: 'HS256' }
    );
    res.json({ token, tokenType: 'Bearer', expiresIn: 3600 });
  } catch (error) { next(error); }
});

module.exports = router;
