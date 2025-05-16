require('dotenv').config();

module.exports = {
    VERIFY_TOKEN: process.env.VERIFY_TOKEN,
    WHATSAPP_TOKEN: process.env.WHATSAPP_TOKEN,
    PHONE_NUMBER_ID: process.env.PHONE_NUMBER_ID,
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    ASSISTANT_ID: process.env.ASSISTANT_ID,
    FIREBASE_CONFIG: JSON.parse(process.env.FIREBASE_CONFIG)
};
