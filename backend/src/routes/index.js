const express = require('express');
const { health } = require('../controllers/healthController');
const authRoutes = require('./auth');

const router = express.Router();

// Lightweight endpoint for deploy/startup checks.
router.get('/health', health);

// Authentication
router.use('/auth', authRoutes);

module.exports = router;

