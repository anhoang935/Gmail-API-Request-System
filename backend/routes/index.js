import express from 'express';
import { homePage, fetchRoute, oauth2callback, downloadAttachment } from '../controllers/serviceController.js';
import { findAllUsers, removeUser } from '../controllers/userController.js';
import { findAllEmail } from '../controllers/emailController.js';

const router = express.Router();

//Backend display
router.get('/', homePage);

//Gmail
router.post('/fetch', fetchRoute);
router.post('/oauth2callback', oauth2callback);

//Email
router.get('/download', downloadAttachment);
router.get('/emails', findAllEmail)

//User
router.delete('/user', removeUser);
router.get('/users', findAllUsers);

export default router;
