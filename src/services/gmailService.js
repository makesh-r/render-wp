require('dotenv').config();
const { google } = require('googleapis');

// Gmail OAuth2
const oAuth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
);
oAuth2Client.setCredentials({ refresh_token: process.env.GOOGLE_REFRESH_TOKEN });

const gmail = google.gmail({ version: 'v1', auth: oAuth2Client });

// Utility to send email
async function sendEmail(to, subject, text) {
    const raw = Buffer.from(`To: ${to}\nSubject: ${subject}\n\n${text}`)
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');

    await gmail.users.messages.send({
        userId: 'me',
        requestBody: { raw },
    });
}

module.exports = {
    sendEmail,
};