const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../db/dbConfig');

router.post('/login', (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ error: 'Vyplňte všechny údaje' });
    }

    const query = 'SELECT * FROM users WHERE username = ?';
    db.execute(query, [username], (err, results) => {
        if (err) {
            return res.status(500).json({ error: 'Chyba při načítání uživatele' });
        }

        if (results.length === 0) {
            return res.status(401).json({ error: 'Neplatné přihlašovací údaje' });
        }

        const user = results[0];

        console.log('Zadané heslo:', password);
        console.log('Hashované heslo z DB:', user.password);

        bcrypt.compare(password, user.password, (err, isMatch) => {
            if (err || !isMatch) {
                return res.status(401).json({ error: 'Neplatné heslo' });
            }

            const token = jwt.sign(
                { id: user.id, username: user.username, role: user.role },
                process.env.JWT_SECRET,
                { expiresIn: '1h' }
            );

            return res.status(200).json({ message: 'Přihlášení úspěšné', token });
        });
    });
});
