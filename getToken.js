const axios = require('axios');

const CLIENT_ID = '9VT5ODeGT9iGGuQ_cmI5Gw';
const CLIENT_SECRET = '89AcWKcYX27PEgAvCIllB5AFjMdxwo7L';
const REDIRECT_URI = 'http://localhost:9001';

async function getAccessToken(authCode) {
    try {
        const response = await axios.post(
            'https://zoom.us/oauth/token',
            null,
            {
                params: {
                    grant_type: 'authorization_code',
                    code: authCode,
                    redirect_uri: REDIRECT_URI,
                },
                auth: {
                    username: CLIENT_ID,
                    password: CLIENT_SECRET,
                },
            }
        );
        console.log('Access Token:', response.data.access_token);
        console.log('Refresh Token:', response.data.refresh_token);
        return response.data;
    } catch (error) {
        console.error('Error fetching access token:', error.response ? error.response.data : error.message);
    }
}

// Replace with the actual authorization code you received
const AUTHORIZATION_CODE = 'gWAA8hvKxy2WO1bXJGZT4ioh-NO1X6i1w';
getAccessToken(AUTHORIZATION_CODE);
