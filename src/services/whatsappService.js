const axios = require('axios');
const { WHATSAPP_TOKEN, PHONE_NUMBER_ID } = require('../config');

// Send message via WhatsApp Cloud API
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

module.exports = { sendWhatsAppMessage };