const app = require('./src/app.js');
// const { google } = require('googleapis');
const { PORT, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI, GOOGLE_REFRESH_TOKEN } = require('./src/config/index.js');

// const oAuth2Client = new google.auth.OAuth2(
//     GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI
// );
// oAuth2Client.setCredentials({ refresh_token: GOOGLE_REFRESH_TOKEN });

// const gmail = google.gmail({ version: 'v1', auth: oAuth2Client });

app.listen(PORT, async () => {
    console.log(`Server is running on port ${PORT}`);
    // try {
    //     const response = await gmail.users.watch({
    //         userId: 'me',
    //         requestBody: {
    //             labelIds: ['INBOX'],
    //             topicName: "projects/wp-mcp-93b69/topics/gmail-inbox-updates",
    //         },
    //     });

    //     console.log('Watch started:', response.data);
    // } catch (err) {
    //     console.error('Watch setup failed:', err.response?.data || err.message);
    // }
});
