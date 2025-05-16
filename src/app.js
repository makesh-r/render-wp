const express = require('express');
const bodyParser = require('body-parser');
const admin = require('firebase-admin');
const webhookRoutes = require('./routes/webhookRoutes');
const { FIREBASE_CONFIG } = require('../config');

admin.initializeApp({
    credential: admin.credential.cert(FIREBASE_CONFIG)
});

const app = express();
app.use(bodyParser.json());

app.get('/', (req, res) => res.send('WhatsApp GPT Bot is running!'));

app.use('/', webhookRoutes);

module.exports = app;
