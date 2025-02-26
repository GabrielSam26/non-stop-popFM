const ytdl = require('ytdl-core');
const ffmpeg = require('fluent-ffmpeg');
const IcecastSource = require('icecast-source');
const config = require('../config');

let currentStream = null;
let playlist = [];

const streamController = {
    addSong: async (req, res) => {
        try {
            const { url } = req.body;
            const videoInfo = await ytdl.getInfo(url);
            
            playlist.push({
                url,
                title: videoInfo.videoDetails.title,
                duration: videoInfo.videoDetails.lengthSeconds,
                addedAt: new Date()
            });

            if (!currentStream) {
                startStreaming();
            }

            res.json({ message: 'Song added to playlist', playlist });
        } catch (error) {
            console.error('Error adding song:', error);
            res.status(500).json({ error: error.message });
        }
    },

    getPlaylist: (req, res) => {
        res.json(playlist);
    },

    clearPlaylist: (req, res) => {
        playlist = [];
        if (currentStream) {
            try {
                currentStream.destroy();
                currentStream = null;
            } catch (error) {
                console.error('Error clearing stream:', error);
            }
        }
        res.json({ message: 'Playlist cleared' });
    }
};

function startStreaming() {
    if (playlist.length === 0) {
        currentStream = null;
        return;
    }

    const currentSong = playlist[0];
    
    try {
        const stream = ytdl(currentSong.url, { 
            quality: 'highestaudio',
            filter: 'audioonly'
        });

        const icecast = new IcecastSource({
            host: config.icecast.host,
            port: config.icecast.port,
            password: config.icecast.password,
            mount: config.icecast.mount,
            metadata: {
                name: 'Radio Stream',
                description: `Now playing: ${currentSong.title}`,
                genre: 'Various',
                url: 'http://your-station-url'
            },
            format: 'mp3',
            bitrate: 128,
            samplerate: 44100,
            channels: 2
        });

        ffmpeg(stream)
            .toFormat('mp3')
            .audioBitrate(128)
            .audioChannels(2)
            .audioFrequency(44100)
            .on('end', () => {
                console.log('Finished streaming song:', currentSong.title);
                playlist.shift();
                if (currentStream) {
                    currentStream.destroy();
                }
                startStreaming();
            })
            .on('error', (err) => {
                console.error('FFmpeg error:', err);
                playlist.shift();
                if (currentStream) {
                    currentStream.destroy();
                }
                startStreaming();
            })
            .pipe(icecast);

        currentStream = icecast;

        icecast.on('error', (error) => {
            console.error('Icecast error:', error);
            if (currentStream) {
                currentStream.destroy();
                currentStream = null;
            }
            playlist.shift();
            startStreaming();
        });

    } catch (error) {
        console.error('Streaming error:', error);
        playlist.shift();
        if (currentStream) {
            currentStream.destroy();
            currentStream = null;
        }
        startStreaming();
    }
}

module.exports = streamController;
