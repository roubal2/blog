const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const User = require('../db/dbConfig.js'); 
const SECRET_KEY = process.env.JWT_SECRET || 'your_jwt_secret'; // Upravte podle svého .env souboru

// POST /api/auth/login - Přihlášení uživatele
router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    // Najdeme uživatele podle uživatelského jména
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(401).json({ success: false, message: 'Uživatel nenalezen!' });
    }

    // Ověření hesla
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ success: false, message: 'Neplatné heslo!' });
    }

    // Vytvoření JWT tokenu
    const token = jwt.sign(
      { userId: user._id, username: user.username, isAdmin: user.isAdmin },
      SECRET_KEY,
      { expiresIn: '1h' } // Platnost tokenu na 1 hodinu
    );

    // Vrácení odpovědi s tokenem
    res.json({ success: true, message: 'Přihlášení bylo úspěšné!', token });
  } catch (error) {
    console.error('Chyba při přihlašování:', error);
    res.status(500).json({ success: false, message: 'Serverová chyba!' });
  }
});

// GET /api/auth/me - Získání informací o přihlášeném uživateli
router.get('/me', (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Chybí token!' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    res.json({ success: true, userId: decoded.userId, username: decoded.username, isAdmin: decoded.isAdmin });
  } catch (error) {
    console.error('Neplatný token:', error);
    res.status(401).json({ success: false, message: 'Neplatný token!' });
  }
});

module.exports = router;
