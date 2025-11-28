const express = require('express');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// === MIDDLEWARE ===
// Enables Express to read JSON request bodies

const cors = require('cors');
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


// === ROUTES ===
const competitionRoutes = require('./routes/competitionRoutes');
app.use('/api/competitions', competitionRoutes);

// === TEST ROUTE ===
app.get('/', (req, res) => {
  res.send('Leaderboard API is running!');
});

// === START SERVER ===
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
