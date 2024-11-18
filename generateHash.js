const bcrypt = require('bcrypt');
const saltRounds = 10;
const password = '1234';

bcrypt.hash(password, saltRounds, (err, hash) => {
    if (err) {
        console.error('Chyba při generování hash:', err);
    } else {
        console.log('Hashované heslo:', hash);
    }
});
