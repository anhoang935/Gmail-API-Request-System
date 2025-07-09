require('dotenv').config();
const express = require('express');
const cron = require('node-cron');
const routes = require('./routes');

const app = express();

app.use('/', routes);

const {fetchEmails} = require('./services/gmailService');
cron.schedule('0 * * * *', () => {
    console.log('Auto-fetching emails');
    fetchEmails().then(console.log).catch(console.error);
})

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Server running on port ${port}`));