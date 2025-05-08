const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
require('dotenv').config();

const app = express();
app.use(bodyParser.json());

const VERIFY_TOKEN = process.env.VERIFY_TOKEN;
const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN;
const PHONE_NUMBER_ID = process.env.PHONE_NUMBER_ID;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

// ✅ Verify webhook (Meta requirement)
app.get('/webhook', (req, res) => {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
        console.log('WEBHOOK_VERIFIED');
        res.status(200).send(challenge);
    } else {
        res.sendStatus(403);
    }
});

// ✅ Handle incoming WhatsApp messages
app.post('/webhook', async (req, res) => {
    const entry = req.body.entry?.[0];
    const changes = entry?.changes?.[0];
    const message = changes?.value?.messages?.[0];
    const phoneNumberId = changes?.value?.metadata?.phone_number_id;

    if (message) {
        const from = message.from;
        const userMessage = message.text.body;

        // 🔁 Send user message to GPT
        const gptReply = await getGptReply(userMessage);

        // 🔁 Send GPT reply to WhatsApp
        await sendWhatsAppMessage(from, gptReply);
    }

    res.sendStatus(200);
});

// 🔹 Send message via WhatsApp Cloud API
async function sendWhatsAppMessage(to, text) {
    try {
        await axios.post(
            `https://graph.facebook.com/v18.0/${PHONE_NUMBER_ID}/messages`,
            {
                messaging_product: 'whatsapp',
                to,
                text: { body: text },
            },
            {
                headers: {
                    Authorization: `Bearer ${WHATSAPP_TOKEN}`,
                    'Content-Type': 'application/json',
                },
            }
        );
    } catch (err) {
        console.error('Error sending message:', err.response?.data || err.message);
    }
}

// 🔹 Get GPT response
async function getGptReply(message) {
    try {
        const res = await axios.post(
            'https://api.openai.com/v1/chat/completions',
            {
                model: 'gpt-4',
                messages: [{ role: 'user', content: message }],
            },
            {
                headers: {
                    Authorization: `Bearer ${OPENAI_API_KEY}`,
                    'Content-Type': 'application/json',
                },
            }
        );
        return res.data.choices[0].message.content.trim();
    } catch (err) {
        console.error('Error calling OpenAI:', err.response?.data || err.message);
        return 'Sorry, there was an error processing your message.';
    }
}

app.listen(3000, () => console.log('Server running on port 3000'));
