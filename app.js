const express = require('express');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
const cors = require('cors');
const blogRoutes = require('./routes/blogRoutes');
const authRoutes = require('./routes/authRoutes');

dotenv.config();
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public')); 

app.use('/api/auth', authRoutes);
app.use('/api/blog', blogRoutes);

app.listen(PORT, () => {
  console.log(`Server běží na http://localhost:${PORT}`);
});
