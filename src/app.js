const express = require('express');
const bodyParser = require('body-parser');
const webhookRoutes = require('./routes/webhookRoutes');

const app = express();
app.use(bodyParser.json());

app.get('/', (req, res) => res.send('WhatsApp GPT Bot is running!'));

app.use('/', webhookRoutes);

module.exports = app;
