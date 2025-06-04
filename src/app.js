const express = require('express');
const bodyParser = require('body-parser');
const webhookRoutes = require('./routes/webhookRoutes');
const authRoutes = require('./routes/authRoutes');
const gmailRoutes = require('./routes/gmailRoutes');

const app = express();
app.use(bodyParser.json());

app.get('/', (req, res) => res.send('WhatsApp Bot is running!'));

app.use('/', webhookRoutes);
app.use('/auth', authRoutes);
app.use("/gmail-webhook", gmailRoutes);

module.exports = app;
