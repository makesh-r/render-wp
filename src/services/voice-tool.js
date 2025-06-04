require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const { OpenAIApi, Configuration } = require('openai');
const VoiceResponse = require('twilio').twiml.VoiceResponse;

const app = express();
app.use(bodyParser.urlencoded({ extended: false }));

const openai = new OpenAIApi(new Configuration({
    apiKey: process.env.OPENAI_API_KEY,
}));

// Entry point for incoming call
app.post('/voice', (req, res) => {
    const twiml = new VoiceResponse();

    twiml.say('Hello! Please ask your question after the beep. I will get back with an answer.');
    twiml.record({
        action: '/process-recording',
        maxLength: 20,
        transcribe: true,
        transcribeCallback: '/transcription',
    });

    res.type('text/xml');
    res.send(twiml.toString());
});

// Called when transcription is done
app.post('/transcription', async (req, res) => {
    const transcriptionText = req.body.TranscriptionText;
    const caller = req.body.Caller;

    try {
        // Get LLM response
        const aiResponse = await openai.createChatCompletion({
            model: 'gpt-4',
            messages: [
                { role: 'system', content: 'You are a voice assistant.' },
                { role: 'user', content: transcriptionText }
            ]
        });

        const replyText = aiResponse.data.choices[0].message.content;

        // Store reply for the follow-up call or state if needed
        // You can also use a database to persist sessions

        console.log(`Reply to ${caller}: ${replyText}`);
    } catch (error) {
        console.error('Error generating AI response:', error);
    }

    res.sendStatus(200);
});

// Playback AI-generated text response (simplified)
app.post('/process-recording', (req, res) => {
    const twiml = new VoiceResponse();

    twiml.say('Thank you. Please wait while I process your response.');
    twiml.pause({ length: 2 });
    twiml.say('This is a placeholder response. AI reply will be here next time.');

    // You can dynamically insert response if saved from /transcription

    res.type('text/xml');
    res.send(twiml.toString());
});

app.listen(3000, () => {
    console.log('Voice agent running on http://localhost:3000');
});


// TWILIO_ACCOUNT_SID = your_twilio_sid
// TWILIO_AUTH_TOKEN = your_twilio_auth_token
// TWILIO_PHONE_NUMBER = your_twilio_phone
// OPENAI_API_KEY = your_openai_api_key
