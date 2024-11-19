const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../db/dbConfig');

// Přihlášení uživatele
router.post('/login', async (req, res) => {
    const { username, password } = req.body;

    // Kontrola, zda jsou vyplněné údaje
    if (!username || !password) {
        return res.status(400).json({ error: 'Vyplňte všechny údaje' });
    }

    try {
        // Načítání uživatele z databáze
        const query = 'SELECT * FROM users WHERE username = ?';
        const [results] = await db.execute(query, [username]);

        if (results.length === 0) {
            return res.status(401).json({ error: 'Neplatné přihlašovací údaje' });
        }

        const user = results[0];
        console.log('Zadané heslo:', password);
        console.log('Hashované heslo z DB:', user.password);

        // Porovnání zadaného hesla s hashovaným heslem v databázi
        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(401).json({ error: 'Neplatné heslo' });
        }

        // Vytvoření JWT tokenu
        const token = jwt.sign(
            { id: user.id, username: user.username, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );

        // Vrácení úspěšné odpovědi s tokenem
        return res.status(200).json({ success: true, message: 'Přihlášení úspěšné', token });
    } catch (error) {
        console.error('Chyba při přihlašování:', error);
        return res.status(500).json({ error: 'Serverová chyba' });
    }
});

module.exports = router;
