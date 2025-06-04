require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const { Configuration, OpenAIApi } = require('openai');
const twilio = require('twilio');

const app = express();
app.use(bodyParser.urlencoded({ extended: false }));

// OpenAI setup
const openai = new OpenAIApi(new Configuration({
    apiKey: process.env.OPENAI_API_KEY,
}));

// Twilio setup
const twilioClient = twilio(
    process.env.TWILIO_ACCOUNT_SID,
    process.env.TWILIO_AUTH_TOKEN
);

// Receive SMS via webhook
app.post('/sms', async (req, res) => {
    const from = req.body.From;
    const message = req.body.Body;

    console.log(`Received SMS from ${from}: ${message}`);

    try {
        // Send message to LLM
        const completion = await openai.createChatCompletion({
            model: 'gpt-4',
            messages: [
                { role: 'system', content: 'You are an assistant replying to customer texts.' },
                { role: 'user', content: message }
            ],
        });

        const reply = completion.data.choices[0].message.content;

        // Send reply via SMS
        await twilioClient.messages.create({
            body: reply,
            from: process.env.TWILIO_PHONE_NUMBER,
            to: from,
        });

        res.set('Content-Type', 'text/xml');
        res.send('<Response></Response>'); // Twilio expects XML
    } catch (err) {
        console.error(err);
        res.status(500).send('Error processing SMS');
    }
});

app.listen(3000, () => {
    console.log('SMS agent listening on http://localhost:3000/sms');
});


// TWILIO_ACCOUNT_SID=your_twilio_sid
// TWILIO_AUTH_TOKEN=your_twilio_auth_token
// TWILIO_PHONE_NUMBER=your_twilio_phone_number
// OPENAI_API_KEY=your_openai_api_key
