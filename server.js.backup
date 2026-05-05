// server.js - Combined server with frontend serving
const express = require('express');
const path = require('path');
const cors = require('cors');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'data.json');

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files (frontend)
app.use(express.static(path.join(__dirname, 'public')));

// Load data from JSON file
let items = [];
function loadData() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const data = fs.readFileSync(DATA_FILE, 'utf8');
      items = JSON.parse(data);
      console.log(`Loaded ${items.length} items from ${DATA_FILE}`);
    } else {
      items = [];
      console.log('No existing data file found, starting with empty list');
    }
  } catch (error) {
    console.error('Error loading data:', error);
    items = [];
  }
}

// Save data to JSON file
function saveData() {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(items, null, 2));
    console.log(`Saved ${items.length} items to ${DATA_FILE}`);
  } catch (error) {
    console.error('Error saving data:', error);
  }
}

// Initialize data on startup
loadData();

// API routes
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
  saveData(); // Persist the change
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

  saveData(); // Persist the change
  res.json(item);
});

app.delete('/api/items/:id', (req, res) => {
  const index = items.findIndex(i => i.id === parseInt(req.params.id));
  if (index === -1) {
    return res.status(404).json({ error: 'Item not found' });
  }

  items.splice(index, 1);
  saveData(); // Persist the change
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