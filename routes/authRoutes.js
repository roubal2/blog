const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const db = require('../db/dbConfig'); // Připojení k MySQL databázi
const SECRET_KEY = process.env.JWT_SECRET; // Upravte podle svého .env souboru


// POST /api/auth/register - Registrace uživatele
router.post('/register', async (req, res) => {
  const { username, password, role } = req.body;

  try {
    // Kontrola existence uživatele
    const [existingUser] = await db.promise().query(
      `SELECT * FROM users WHERE username = ?`, [username]
    );

    if (existingUser.length > 0) {
      return res.status(400).json({ success: false, message: 'Uživatel již existuje!' });
    }

    // Zašifrování hesla
    const hashedPassword = await bcrypt.hash(password, 10);
    console.log('Zašifrované heslo:', hashedPassword);

    // Vložení uživatele do databáze
    await db.promise().query(
      `INSERT INTO users (username, password, role) VALUES (?, ?, ?)`,
      [username, hashedPassword, role || 'user']
    );

    res.status(201).json({ success: true, message: 'Registrace byla úspěšná!' });
  } catch (error) {
    console.error('Chyba při registraci:', error);
    res.status(500).json({ success: false, message: 'Serverová chyba!' });
  }
});

// POST /api/auth/login - Přihlášení uživatele
router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    console.log('Looking for user: ', username);

    // SQL dotaz pro získání uživatele podle jména
    const [rows] = await db.promise().query(`SELECT * FROM users WHERE username = ?`, [username]);
    console.log('User request result: ', rows);

    if (rows.length === 0) {
      console.log('User not found');
      return res.status(401).json({ success: false, message: 'User not found' });
    }

    const user = rows[0]; // První nalezený uživatel

    // Ověření hesla
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ success: false, message: 'Neplatné heslo!' });
    }

    // Vytvoření JWT tokenu
    const token = jwt.sign(
      { userId: user.id, username: user.username, role: user.role },
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
    res.json({ success: true, userId: decoded.userId, username: decoded.username, role: decoded.role });
  } catch (error) {
    console.error('Neplatný token:', error);
    res.status(401).json({ success: false, message: 'Neplatný token!' });
  }
});

module.exports = router;
