const express = require('express');
const router = express.Router();
const db = require('../db/dbConfig');
const jwt = require('jsonwebtoken');

// Middleware pro kontrolu tokenu
const authenticate = (req, res, next) => {
  const token = req.headers['authorization'];
  if (!token) {
    return res.status(401).json({ error: 'Pristup odepren' });
  }

  jwt.verify(token.split(' ')[1], process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalidní token' });
    }
    req.user = user;
    next();
  });
};

// DELETE - pouze vlastník nebo admin
router.delete('/:blogId', authenticate, (req, res) => {
  const { blogId } = req.params;
  const { id, role } = req.user;

  const query = 'SELECT * FROM blog_posts WHERE id = ?';
  db.execute(query, [blogId], (err, results) => {
    if (err || results.length === 0) {
      return res.status(404).json({ error: 'Blog post nebyl nalezen' });
    }

    const post = results[0];
    if (post.user_id !== id && role !== 'admin') {
      return res.status(403).json({ error: 'Nemáte oprávnění' });
    }

    const deleteQuery = 'DELETE FROM blog_posts WHERE id = ?';
    db.execute(deleteQuery, [blogId], (deleteErr) => {
      if (deleteErr) {
        return res.status(500).json({ error: 'Chyba při mazání' });
      }
      res.json({ message: 'Blog post smazán' });
    });
  });
});

// POST - Přidání nového blogového příspěvku
router.post('/add', authenticate, (req, res) => {
  const { content } = req.body;
  const { username, id } = req.user;

  if (!content) {
    return res.status(400).json({ error: 'Obsah příspěvku je povinný' });
  }

  const query = 'INSERT INTO blog_posts (content, author, user_id) VALUES (?, ?, ?)';
  db.execute(query, [content, username, id], (err, results) => {
    if (err) {
      return res.status(500).json({ error: 'Chyba při přidávání příspěvku' });
    }
    res.status(201).json({ message: 'Příspěvek byl úspěšně přidán', postId: results.insertId });
  });
});

// GET - Všechny blogové příspěvky
router.get('/', (req, res) => {
  db.execute('SELECT * FROM blog_posts', (err, results) => {
    if (err) {
      return res.status(500).json({ error: 'Chyba při načítání blog postů' });
    }
    res.json(results);
  });
});

module.exports = router;
