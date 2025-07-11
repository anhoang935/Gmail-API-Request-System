import dotenv from 'dotenv';
import express from 'express';
import cron from 'node-cron';
import routes from './routes/index.js';
import { connectDB } from './config/db.js';
import { fetchEmails } from './services/gmailService.js';

dotenv.config();

const app = express();

connectDB();

app.use('/', routes);

cron.schedule('0 * * * *', () => {
    console.log('Auto-fetching emails');
    fetchEmails().then(console.log).catch(console.error);
})

const port = process.env.PORT || 5000;
app.listen(port, () => console.log(`Server running on port ${port}`));