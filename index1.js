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
const ASSISTANT_ID = process.env.ASSISTANT_ID;

app.get('/', (req, res) => {
    res.send('WhatsApp GPT Bot is running!');
});

// ✅ Verify webhook (Meta requirement)
app.get('/webhook', (req, res) => {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    console.log('Webhook GET called with:');
    console.log('Mode:', mode);
    console.log('Challenge:', challenge);

    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
        console.log('✅ WEBHOOK_VERIFIED');
        res.status(200).send(challenge);
    } else {
        console.log('❌ WEBHOOK_VERIFICATION_FAILED');
        res.sendStatus(403);
    }
});

// ✅ Handle incoming WhatsApp messages
app.post('/webhook', async (req, res) => {

    console.log('Webhook POST called with body:', req.body);
    const entry = req.body.entry?.[0];
    const changes = entry?.changes?.[0];
    const message = changes?.value?.messages?.[0];
    const phoneNumberId = changes?.value?.metadata?.phone_number_id;

    console.log("From:", message?.from);
    console.log("Message:", message?.userMessage);
    console.log("Phone Number ID:", phoneNumberId);
    console.log("Time Stamp:", new Date().toISOString());

    if (message) {
        const from = message.from;
        const userMessage = message.text.body;

        console.log("From:", from);
        console.log("Message:", userMessage);
        console.log("Phone Number ID:", phoneNumberId);
        console.log("Time Stamp:", new Date().toISOString());

        // 🔁 Send user message to GPT
        const gptReply = await getGptAssistantReply(userMessage);
        // const gptReply = await getGptReply(userMessage);

        console.log("GPT Reply:", gptReply);

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
        console.log(`Message sent to ${to}: ${text}`);
    } catch (err) {
        console.error('Error sending message:', err.response?.data || err.message);
    }
}

async function getGptAssistantReply(message) {
    const OPENAI_API_BASE = 'https://api.openai.com/v1';
    const headers = {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
        'OpenAI-Beta': 'assistants=v2'
    };

    try {
        // Step 1: Create a thread
        const threadRes = await axios.post(`${OPENAI_API_BASE}/threads`, {}, { headers });
        const threadId = threadRes.data.id;

        // Step 2: Add a user message to the thread
        await axios.post(
            `${OPENAI_API_BASE}/threads/${threadId}/messages`,
            {
                role: 'user',
                content: message,
            },
            { headers }
        );

        // Step 3: Create a run
        const runRes = await axios.post(
            `${OPENAI_API_BASE}/threads/${threadId}/runs`,
            {
                assistant_id: ASSISTANT_ID,
            },
            { headers }
        );
        const runId = runRes.data.id;

        // Step 4: Poll the run until it completes
        let runStatus = 'in_progress';
        while (runStatus === 'in_progress' || runStatus === 'queued') {
            await new Promise(resolve => setTimeout(resolve, 1000)); // Wait for 1 second
            const statusRes = await axios.get(
                `${OPENAI_API_BASE}/threads/${threadId}/runs/${runId}`,
                { headers }
            );
            runStatus = statusRes.data.status;
        }

        if (runStatus !== 'completed') {
            throw new Error(`Run failed with status: ${runStatus}`);
        }

        // Step 5: Retrieve messages
        const messagesRes = await axios.get(
            `${OPENAI_API_BASE}/threads/${threadId}/messages`,
            { headers }
        );

        const messages = messagesRes.data.data;
        const assistantReply = messages.find(msg => msg.role === 'assistant')?.content[0]?.text?.value;

        return assistantReply?.trim() || 'No reply from assistant.';
    } catch (err) {
        console.error('Error calling OpenAI Assistant API:', err.response?.data || err.message);
        return 'Sorry, there was an error processing your message.';
    }
}

app.listen(8080, () => console.log('Server running on port 8080'));

// 🔹 Get GPT response
async function getGptReply(message) {
    try {
        const res = await axios.post(
            'https://api.openai.com/v1/chat/completions',
            {
                model: 'gpt-4o',
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
