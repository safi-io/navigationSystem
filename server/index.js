
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Connect to MongoDB
mongoose
  .connect("mongodb://localhost:27017", {
  })
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error(err));

app.use('/api/navigation', require('./routes/navigation'));

app.get('/', (req, res) => {
  res.send('Campus Navigation API is running');
})

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));