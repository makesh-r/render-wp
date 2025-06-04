// require('dotenv').config();
// const express = require('express');
// const bodyParser = require('body-parser');
// const { google } = require('googleapis');
// const { Configuration, OpenAIApi } = require('openai');

// const app = express();
// app.use(bodyParser.json());

// // OpenAI
// const openai = new OpenAIApi(new Configuration({
//     apiKey: process.env.OPENAI_API_KEY,
// }));

// // Google OAuth2 setup
// const oAuth2Client = new google.auth.OAuth2(
//     process.env.GOOGLE_CLIENT_ID,
//     process.env.GOOGLE_CLIENT_SECRET,
//     process.env.GOOGLE_REDIRECT_URI
// );

// oAuth2Client.setCredentials({ refresh_token: process.env.GOOGLE_REFRESH_TOKEN });
// const calendar = google.calendar({ version: 'v3', auth: oAuth2Client });

// // ─────────────────────────────────────────────────────────────
// // Parse natural language command and create event
// app.post('/create-event', async (req, res) => {
//     const userInput = req.body.query;

//     try {
//         // Ask LLM to extract event details
//         const ai = await openai.createChatCompletion({
//             model: 'gpt-4',
//             messages: [
//                 { role: 'system', content: 'Extract structured event details from user input.' },
//                 { role: 'user', content: `Schedule this: ${userInput}. Format: title, date, start time, end time.` }
//             ],
//         });

//         const reply = ai.data.choices[0].message.content;
//         const [summary, date, startTime, endTime] = reply.split(',').map(s => s.trim());

//         const event = {
//             summary,
//             start: { dateTime: new Date(`${date}T${startTime}`).toISOString(), timeZone: 'UTC' },
//             end: { dateTime: new Date(`${date}T${endTime}`).toISOString(), timeZone: 'UTC' },
//         };

//         const result = await calendar.events.insert({
//             calendarId: 'primary',
//             requestBody: event,
//         });

//         res.json({ success: true, eventLink: result.data.htmlLink });
//     } catch (err) {
//         console.error(err);
//         res.status(500).send('Error creating event');
//     }
// });

// // ─────────────────────────────────────────────────────────────
// // Read next 5 upcoming events
// app.get('/upcoming-events', async (req, res) => {
//     try {
//         const response = await calendar.events.list({
//             calendarId: 'primary',
//             timeMin: new Date().toISOString(),
//             maxResults: 5,
//             singleEvents: true,
//             orderBy: 'startTime',
//         });

//         const events = response.data.items.map(evt => ({
//             summary: evt.summary,
//             start: evt.start.dateTime || evt.start.date,
//         }));

//         res.json(events);
//     } catch (err) {
//         console.error(err);
//         res.status(500).send('Error fetching events');
//     }
// });

// app.listen(3000, () => {
//     console.log('Calendar agent running on http://localhost:3000');
// });

// // GOOGLE_CLIENT_ID=your_google_client_id
// // GOOGLE_CLIENT_SECRET=your_google_client_secret
// // GOOGLE_REDIRECT_URI=http://localhost:3000/oauth2callback
// // GOOGLE_REFRESH_TOKEN=your_refresh_token
// // OPENAI_API_KEY=your_openai_api_key
