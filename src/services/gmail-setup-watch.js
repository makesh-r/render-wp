// Run this script only once

require('dotenv').config();
const { google } = require('googleapis');

const oAuth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
);

oAuth2Client.setCredentials({
    refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
});

const gmail = google.gmail({ version: 'v1', auth: oAuth2Client });

async function setupWatch() {
    try {
        const response = await gmail.users.watch({
            userId: 'me',
            requestBody: {
                labelIds: ['INBOX'],
                topicName: 'projects/YOUR_PROJECT_ID/topics/YOUR_TOPIC_NAME',
            },
        });

        console.log('Watch response:', response.data);
    } catch (error) {
        console.error('Failed to set up watch:', error.response?.data || error.message);
    }
}

setupWatch();
