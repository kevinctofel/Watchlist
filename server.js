// server.js - Combined server with frontend serving
const express = require('express');
const path = require('path');
const cors = require('cors');
const fs = require('fs');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'data.json');
const TMDB_API_KEY = 'aeee659edaaa6cd1b4906c4b70a856a8';
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w500';

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

// TMDB API helper function
async function fetchTMDBMetadata(title, type, year) {
  try {
    // Search for the title on TMDB
    const searchParams = new URLSearchParams({
      api_key: TMDB_API_KEY,
      query: title,
      year: year || undefined,
      type: type === 'movie' ? 'movie' : 'tv'
    });

    const searchResponse = await axios.get(`${TMDB_BASE_URL}/search/${type === 'movie' ? 'movie' : 'tv'}?${searchParams}`);

    if (searchResponse.data.results && searchResponse.data.results.length > 0) {
      const result = searchResponse.data.results[0];

      // Get detailed information for better metadata
      const detailResponse = await axios.get(`${TMDB_BASE_URL}/${type === 'movie' ? 'movie' : 'tv'}/${result.id}?api_key=${TMDB_API_KEY}`);

      return {
        poster_path: detailResponse.data.poster_path,
        backdrop_path: detailResponse.data.backdrop_path,
        overview: detailResponse.data.overview,
        release_date: detailResponse.data.release_date || detailResponse.data.first_air_date,
        vote_average: detailResponse.data.vote_average,
        tmdb_id: result.id
      };
    }

    return null;
  } catch (error) {
    console.error('Error fetching TMDB metadata:', error.message);
    return null;
  }
}

// API routes
app.get('/api/items', (req, res) => {
  res.json(items);
});

app.post('/api/items', async (req, res) => {
  const { title, type, year, genre } = req.body;
  if (!title) {
    return res.status(400).json({ error: 'Title is required' });
  }

  // Fetch TMDB metadata
  const tmdbMetadata = (await fetchTMDBMetadata(title, type, year)) || {};

    const yearFromTMDB = tmdbMetadata?.release_date?.slice(0,4) || null;
    const newItem = {
        id: Date.now(),
        title,
        type,
        year: yearFromTMDB ?? (year ? year.toString().slice(0,4) : null),
        genre: null,
        addedAt: new Date().toISOString(),
        ...tmdbMetadata
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

app.put('/api/items/:id', async (req, res) => {
  const item = items.find(i => i.id === parseInt(req.params.id));
  if (!item) {
    return res.status(404).json({ error: 'Item not found' });
  }

  const { title, type, year, genre } = req.body;
  
  // Fetch TMDB metadata if title, type, or year changed
  const shouldFetchTMDB = title !== undefined || type !== undefined || year !== undefined;
  let tmdbMetadata = {};
  
  if (shouldFetchTMDB) {
    const fetchTitle = title !== undefined ? title : item.title;
    const fetchType = type !== undefined ? type : item.type;
    const fetchYear = year !== undefined ? year : item.year;
    
    tmdbMetadata = await fetchTMDBMetadata(fetchTitle, fetchType, fetchYear) || {};
  }

  if (title !== undefined) item.title = title;
  if (type !== undefined) item.type = type;
  if (year !== undefined) item.year = year;
  if (genre !== undefined) item.genre = genre;
  
  // Update TMDB metadata if fetched
  Object.assign(item, tmdbMetadata);
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

// Fallback to serve index.html for client-side routing (non-API routes)
app.use((req, res, next) => {
  if (!req.path.startsWith('/api/')) {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
  } else {
    // If it's an API route but not matched, send 404
    res.status(404).send('Not Found');
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Frontend available at: http://localhost:${PORT}`);
});