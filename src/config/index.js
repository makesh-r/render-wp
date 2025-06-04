require('dotenv').config();

module.exports = {
    VERIFY_TOKEN: process.env.VERIFY_TOKEN,
    WHATSAPP_TOKEN: process.env.WHATSAPP_TOKEN,
    PHONE_NUMBER_ID: process.env.PHONE_NUMBER_ID,
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    ASSISTANT_ID: process.env.ASSISTANT_ID,
    FIREBASE_CONFIG: JSON.parse(process.env.FIREBASE_CONFIG),
    PORT: process.env.PORT || 8080,
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
    GOOGLE_REDIRECT_URI: process.env.GOOGLE_REDIRECT_URI,
    GOOGLE_REFRESH_TOKEN: process.env.GOOGLE_REFRESH_TOKEN,
};
