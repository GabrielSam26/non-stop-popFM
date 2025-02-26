require('dotenv').config();

const config = {
    icecast: {
        host: process.env.ICECAST_HOST || 'uk26freenew.listen2myradio.com',
        port: process.env.ICECAST_PORT || 3950,
        password: process.env.ICECAST_PASSWORD || 'jacklsrp',
        mount: process.env.ICECAST_MOUNT || '/stream'
    },
    server: {
        port: process.env.PORT || 3000
    }
};

module.exports = config;
