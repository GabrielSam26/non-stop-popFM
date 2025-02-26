const express = require('express');
const cors = require('cors');
const path = require('path');
const streamController = require('./controllers/streamController');
const config = require('./config');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Routes
app.post('/api/add-song', streamController.addSong);
app.get('/api/playlist', streamController.getPlaylist);
app.post('/api/clear-playlist', streamController.clearPlaylist);

// Serve frontend
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(config.server.port, () => {
    console.log(`Server running on port ${config.server.port}`);
});
