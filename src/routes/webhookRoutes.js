const express = require('express');
const { verifyWebhook, handleWebhook } = require('../controllers/webhookController');

const router = express.Router();

router.get('/webhook', verifyWebhook);
router.post('/webhook', handleWebhook);

module.exports = router;
