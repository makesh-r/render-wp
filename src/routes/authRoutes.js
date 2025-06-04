const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Email/password
router.post('/signup', authController.signup);
router.post('/login', authController.login);

// Google OAuth
router.get('/google', authController.googleAuth);
router.get('/google/callback', authController.googleCallback);

// Facebook OAuth
router.get('/facebook', authController.facebookAuth);
router.get('/facebook/callback', authController.facebookCallback);

module.exports = router;
