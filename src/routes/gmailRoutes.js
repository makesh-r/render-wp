const express = require('express');
const { handleGmailWebhook } = require('../controllers/gmailController');

const router = express.Router();

// router.get('/webhook', verifyWebhook);
router.post('/webhook', handleGmailWebhook);

module.exports = router;