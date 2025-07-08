// Import các lib cần thiết
require('dotenv').config();
const { google } = require('googleapis');
const express = require('express');
const app = express();
const mammoth = require('mammoth');
const pdfParse = require('pdf-parse');
const path = require('path');
const fs = require('fs');
const cron = require('node-cron'); 

// Var để lưu data
const EMAIL_DB = path.join(__dirname, 'emails.json');
const TOKEN_DB = path.join(__dirname, 'tokens.json');

// OAuth2 của google
const OAuth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.REDIRECT_URI
);

// Scope cho các API cần sử dụng
const scopes = ['https://www.googleapis.com/auth/gmail.readonly'];

// Các var ngày tháng để chỉnh khoảng thời gian lấy email
const today = new Date();
const yyyy = today.getFullYear();
const mm = String(today.getMonth() + 1).padStart(2, '0');
const dd = String(today.getDate()).padStart(2, '0');
const timeRange = `after:${yyyy}/${mm}/${dd}`;

// Phần backend hiện page chính 
app.get('/', async (req, res) => {
    await fetchEmails();

    const users = loadTokens();
    const userList = users.map(u => `<li>${u.email}</li>`).join('');
    const url = OAuth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: scopes,
        prompt: 'consent'
    });

    const emailList = loadEmails();
    const emailHtmlList = [];
    for(const user of users){
        const userEmails = emailList.filter(e => e.payload.headers.find(e=>e.name=='Delivered-To').value === user.email);
        for(const email of userEmails){
            console.log(email.payload.headers.find(e=>e.name=='Delivered-To').value)
            emailHtmlList.push(await readEmail(email, user.tokens));
        }
    }

    
    const totalEmails = emailList.length;
    const todayEmails = emailList.filter(e => {
    const internalDate = parseInt(e.internalDate);
    return internalDate >= today.setHours(0,0,0,0);
    }).length;

    res.send(`
        <h2>Registered Users</h2>
        <ul>${userList}</ul>
        <a href="${url}">Register New User</a>
        <h2>Email List</h2>
        <a href="/fetch">Fetch Email</a>
        <p>
            <b>Total Email:</b>${totalEmails}
            <br><b>Email Received Today:</b>${todayEmails}
        </p>
        <ul>${emailHtmlList.join('')}</ul>
    `);

});

// Page để người dùng authenticate cho app
app.get('/oauth2callback', async (req,res) => {
    const {code} = req.query;
    const {tokens} = await OAuth2Client.getToken(code);
    OAuth2Client.setCredentials(tokens);

    const gmail = google.gmail({version: 'v1', auth: OAuth2Client});
    const profile = await gmail.users.getProfile({userId: 'me'});
    const email = profile.data.emailAddress;

    let allTokens = loadTokens();
    const existing = allTokens.find(u => u.email === email);
    if(existing){
        existing.tokens = tokens;
    } else {
        allTokens.push({email, tokens});
    }
    saveTokens(allTokens);

    res.send(`Registered user: ${email} | <a href="/">Back to Home</a>`);
});

// Dùng để store email
async function fetchEmails(){

    const users = loadTokens();

    for(const user of users){
        OAuth2Client.setCredentials(user.tokens)

        if (OAuth2Client.isTokenExpiring && OAuth2Client.isTokenExpiring()) {
            const { credentials } = await OAuth2Client.refreshAccessToken();
            OAuth2Client.setCredentials(credentials);
            user.tokens = credentials;
            saveTokens(users);
        }

        const gmail = google.gmail({version:'v1',auth: OAuth2Client});
        const response = await gmail.users.messages.list({
            userId:'me',
            q: timeRange
        })
        
        const messages = response.data.messages;

        if(!messages){
            res.send("There are no messages");
            return;
        }
        
        let savedEmails = loadEmails();

        for(const message of messages){
            const duplicate = savedEmails.find(e => e.id === message.id);
            if (duplicate) {
                console.log(`Skipping duplicate messageId: ${message.id} = ${duplicate.id}`);
                continue;
            }

            const messageInfo = await gmail.users.messages.get({
                userId: 'me',
                id: message.id
            })
            savedEmails.push(messageInfo.data);
        }
        saveEmails(savedEmails);
    }
}

// Route dùng để tạo nút bấm tương tác giúp cho việc fetch email manually
app.get('/fetch', async (req, res) => {
    await fetchEmails();
    res.redirect('/');
})

// Tự động fetch emails mỗi tiếng
cron.schedule('0 * * * *', () => {
    console.log('Auto-fetching emails');
    fetchEmails();
})

// Đọc email và trả về dạng Html để display lên page chính 
async function readEmail(email, tokens){
    OAuth2Client.setCredentials(tokens);
    const gmail = google.gmail({version: 'v1', auth: OAuth2Client});

    const snippet = email.snippet;
    const subject = email.payload.headers.find(e=>e.name=='Subject').value;
    const from = email.payload.headers.find(e=>e.name=='From').value;
    const to = email.payload.headers.find(e=>e.name=='To').value;
    const date = email.payload.headers.find(e=>e.name=='Date').value;
    const parts = email.payload.parts || [];
    let attachments = [];
    for(const part of parts){
        if (part.filename && part.filename.length > 0){
            let attachmentId = part.body.attachmentId;
            const data = await downloadAttachment(email.id, gmail, attachmentId);

            let parsedText = '[Unsupported file type]';
            if(part.filename.endsWith('.docx')){
                parsedText = await parseDocx(data);
            } else if (part.filename.endsWith('.pdf')){
                parsedText = await parsePdf(data);
            }

            attachments.push({
                filename: part.filename,
                attachmentId: part.body.attachmentId,
                content: parsedText
            });
        }
    }
    // console.log(email.payload);
    // console.log(attachments)
    attachmentsContent = attachments.map((a)=>`
        <b>Filename</b>: ${a.filename} | 
        <a href="/download?messageId=${email.id}&attachmentId=${a.attachmentId}&filename=${a.filename}" download>Download</a> 
        <br><b>Content Preview</b>: 
        <br>${a.content}<br>`)
    .join('');
    return `
    <li> 
        <b>From</b> "${from}" <b>To</b> "${to}" | <b>Subject:</b> "${subject}"
        <br><b>Snippet:</b> "${snippet}"
        <br>${attachmentsContent}
        <b>Date: </b>${date}    
    </li>`;
}

// Tải file về thiết bị của người dùng
app.get('/download', async (req,res) => {
    const {messageId, attachmentId, filename} = req.query;
    if(!messageId || !attachmentId || !filename){
        return res.status(400).send('Missing parameters');
    }

    try{
        const gmail = google.gmail({version: 'v1', auth: OAuth2Client});
        const response = await gmail.users.messages.attachments.get({
            userId: 'me',
            messageId: messageId,
            id: attachmentId
        });

        const data = Buffer.from(response.data.data, 'base64');
        
        res.set({
            'Content-Type': 'application/cotet-stream',
            'Content-Disposition': `attachment; filename="${filename}"`
        })
        res.send(data);
    } catch (err) {
        console.error(err);
        res.status(500).send('Error downloading attachment');
    }
});

// Tải nội dung của attrachment nhưng chưa lưu vào database hay ổ đĩa
async function downloadAttachment(messageId, gmail, attachmentId){
    const response = await gmail.users.messages.attachments.get({
        userId: 'me',
        messageId: messageId,
        id: attachmentId
    });

    const data = response.data.data;
    return Buffer.from(data, 'base64');
}

// Xử lý nội dung của file Docx
async function parseDocx(buffer){
    const data = await mammoth.extractRawText({buffer});
    return data.value;
}

// Xử lý nội dung của file PDF
async function parsePdf(buffer){
    const data = await pdfParse(buffer);
    return data.text;
}

// Tải emails lưu trong Json
function loadEmails(){
    try {
        return JSON.parse(fs.readFileSync(EMAIL_DB, 'utf-8'));
    } catch {
        return [];
    }
}

// Lưu emails vào Json
function saveEmails(emails){
    fs.writeFileSync(EMAIL_DB, JSON.stringify(emails, null, 2));
}

// Tải tokens lưu từ trong Json
function loadTokens(){
    try {
        return JSON.parse(fs.readFileSync(TOKEN_DB, 'utf-8'))
    } catch {
        return [];
    }
}

// Lưu tokens vào Json
function saveTokens(allTokens){
    fs.writeFileSync(TOKEN_DB,JSON.stringify(allTokens, null, 2));
}

// Start server
const port = process.env.PORT || 3000;
app.listen(port, ()=>{
    console.log('Server running');
})