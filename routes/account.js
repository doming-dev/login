const express = require('express');
const accountController = require('../controllers/account');
const router = express.Router();

router.get('/account', accountController.getAccount);
router.get('/private', accountController.getPrivate);

module.exports = router;