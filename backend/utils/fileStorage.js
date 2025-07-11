const fs = require('fs');
const path = require('path');

const EMAIL_DB = path.join(__dirname, '../data/emails.json');
const TOKEN_DB = path.join(__dirname, '../data/tokens.json');

function loadEmails(){
    try {
        return JSON.parse(fs.readFileSync(EMAIL_DB, 'utf-8'));
    } catch {
        return [];
    }
}

function saveEmails(emails){
    fs.writeFileSync(EMAIL_DB, JSON.stringify(emails, null, 2));
}

function loadTokens(){
    try {
        return JSON.parse(fs.readFileSync(TOKEN_DB, 'utf-8'));
    } catch {
        return [];
    }
}

function saveTokens(tokens){
    fs.writeFileSync(TOKEN_DB, JSON.stringify(tokens, null, 2));
}

module.exports = {loadEmails, saveEmails, loadTokens, saveTokens};