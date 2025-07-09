const express = require('express');
const router = express.Router();
const {homePage, fetchRoute, oauth2callback, downloadAttachment, removeUser} = require('../services/gmailService');

router.get('/', homePage);
router.get('/fetch', fetchRoute);
router.get('/oauth2callback', oauth2callback);
router.get('/download', downloadAttachment);
router.get('/removeUser', removeUser);

module.exports = router;
