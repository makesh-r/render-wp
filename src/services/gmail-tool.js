// require('dotenv').config();
// const express = require('express');
// const bodyParser = require('body-parser');
// const { google } = require('googleapis');
// const { Configuration, OpenAIApi } = require('openai');

// const app = express();
// app.use(bodyParser.json());

// const openai = new OpenAIApi(new Configuration({
//     apiKey: process.env.OPENAI_API_KEY,
// }));

// // Gmail OAuth2
// const oAuth2Client = new google.auth.OAuth2(
//     process.env.GOOGLE_CLIENT_ID,
//     process.env.GOOGLE_CLIENT_SECRET,
//     process.env.GOOGLE_REDIRECT_URI
// );
// oAuth2Client.setCredentials({ refresh_token: process.env.GOOGLE_REFRESH_TOKEN });

// const gmail = google.gmail({ version: 'v1', auth: oAuth2Client });

// // Utility to send email
// async function sendEmail(to, subject, text) {
//     const raw = Buffer.from(`To: ${to}\nSubject: ${subject}\n\n${text}`)
//         .toString('base64')
//         .replace(/\+/g, '-')
//         .replace(/\//g, '_')
//         .replace(/=+$/, '');

//     await gmail.users.messages.send({
//         userId: 'me',
//         requestBody: { raw },
//     });
// }

// // 📬 Pub/Sub push webhook when email arrives
// app.post('/gmail-notify', async (req, res) => {
//     try {
//         const historyId = req.body.message?.data
//             ? parseInt(Buffer.from(req.body.message.data, 'base64').toString())
//             : null;

//         if (!historyId) return res.status(400).send('Missing historyId');

//         // Step 1: Get latest email
//         const { data: messagesList } = await gmail.users.messages.list({
//             userId: 'me',
//             q: 'is:unread',
//             maxResults: 1,
//         });

//         if (!messagesList.messages || messagesList.messages.length === 0) return res.sendStatus(204);

//         const messageId = messagesList.messages[0].id;
//         const { data: message } = await gmail.users.messages.get({
//             userId: 'me',
//             id: messageId,
//             format: 'full',
//         });

//         const headers = message.payload.headers;
//         const from = headers.find(h => h.name === 'From')?.value;
//         const subject = headers.find(h => h.name === 'Subject')?.value;
//         const bodyPart = message.payload.parts?.find(p => p.mimeType === 'text/plain');
//         const body = bodyPart
//             ? Buffer.from(bodyPart.body.data, 'base64').toString()
//             : 'No message body found.';

//         // Step 2: Send to LLM
//         const llmResponse = await openai.createChatCompletion({
//             model: 'gpt-4',
//             messages: [
//                 { role: 'system', content: 'Reply to this email in a helpful and professional tone.' },
//                 { role: 'user', content: body }
//             ],
//         });

//         const replyText = llmResponse.data.choices[0].message.content;

//         // Step 3: Send reply
//         await sendEmail(from, `Re: ${subject}`, replyText);

//         // Step 4: Mark email as read
//         await gmail.users.messages.modify({
//             userId: 'me',
//             id: messageId,
//             requestBody: { removeLabelIds: ['UNREAD'] },
//         });

//         res.sendStatus(200);
//     } catch (err) {
//         console.error('Error in gmail-notify handler:', err);
//         res.status(500).send('Failed to process email');
//     }
// });


// // GOOGLE_CLIENT_ID = your_client_id
// // GOOGLE_CLIENT_SECRET = your_client_secret
// // GOOGLE_REDIRECT_URI = http://localhost:3000/oauth2callback
// // GOOGLE_REFRESH_TOKEN = your_refresh_token
// // OPENAI_API_KEY = your_openai_api_key
