import express from 'express';
import { homePage, fetchRoute, oauth2callback, downloadAttachment, authRoute } from '../controllers/serviceController.js';
import { findAllUsers, removeUser } from '../controllers/userController.js';
import { findAllEmail, filterEmailByTime, downloadZipAttachment, readAttachment, removeEmail } from '../controllers/emailController.js';

const router = express.Router();

//Backend display
router.get('/', homePage);

//Gmail
router.post('/fetch', fetchRoute);
router.get('/oauth2callback', oauth2callback);
router.get('/auth', authRoute);

//Email
router.get('/download', downloadAttachment);
router.get('/emails', findAllEmail);
router.get('/emails/timeRange', filterEmailByTime);
router.get('/downloadZip', downloadZipAttachment);
router.post('/readAttachment', readAttachment);
router.delete('/email/:id', removeEmail);

//User
router.delete('/user', removeUser);
router.get('/users', findAllUsers);

export default router;
