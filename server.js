// server.js - Combined server with frontend serving
const express = require('express');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files (frontend)
app.use(express.static(path.join(__dirname, 'public')));

// API routes (same as before)
let items = [];

app.get('/api/items', (req, res) => {
  res.json(items);
});

app.post('/api/items', (req, res) => {
  const { title, type, year, genre } = req.body;
  if (!title) {
    return res.status(400).json({ error: 'Title is required' });
  }
  
  const newItem = {
    id: Date.now(),
    title,
    type,
    year,
    genre,
    addedAt: new Date().toISOString()
  };
  
  items.push(newItem);
  res.status(201).json(newItem);
});

app.get('/api/items/:id', (req, res) => {
  const item = items.find(i => i.id === parseInt(req.params.id));
  if (!item) {
    return res.status(404).json({ error: 'Item not found' });
  }
  res.json(item);
});

app.put('/api/items/:id', (req, res) => {
  const item = items.find(i => i.id === parseInt(req.params.id));
  if (!item) {
    return res.status(404).json({ error: 'Item not found' });
  }
  
  const { title, type, year, genre } = req.body;
  if (title) item.title = title;
  if (type) item.type = type;
  if (year) item.year = year;
  if (genre) item.genre = genre;
  item.updatedAt = new Date().toISOString();
  
  res.json(item);
});

app.delete('/api/items/:id', (req, res) => {
  const index = items.findIndex(i => i.id === parseInt(req.params.id));
  if (index === -1) {
    return res.status(404).json({ error: 'Item not found' });
  }
  
  items.splice(index, 1);
  res.status(204).send();
});

// Serve the frontend index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Frontend available at: http://localhost:${PORT}`);
});
