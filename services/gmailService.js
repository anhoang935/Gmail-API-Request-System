const {google} = require('googleapis');
const {loadTokens, saveTokens, loadEmails, saveEmails} = require('../utils/fileStorage');
const {parseDocx, parsePdf} = require('./attachmentService');

const OAuth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.REDIRECT_URI
);
const gmail = google.gmail({version: 'v1', auth: OAuth2Client});
const scopes = ['https://www.googleapis.com/auth/gmail.readonly'];

const today = new Date();
const yyyy = today.getFullYear();
const mm = String(today.getMonth()+1).padStart(2,'0');
const dd = String(today.getDate()).padStart(2,'0');
const timeRange = `after:${yyyy}/${mm}/${dd}`;

async function homePage(req, res){
    await fetchEmails();

    const users = loadTokens();
    const userList = users.map(u => 
        `<li>
            ${u.email}
            <a href="/removeUser?email=${u.email}">    Remove </a>
        </li>`).join('');

    const url = OAuth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: scopes,
        prompt: 'consent'
    });

    const emailList = loadEmails();
    let allUserEmails = [];

    for(const user of users){
        const userEmails = emailList.filter(
            e => e.payload.headers.find(e=>e.name=='Delivered-To').value === user.email)
        .map(e => ({email: e, tokens: user.tokens}));
        
        allUserEmails = allUserEmails.concat(userEmails);
    }

    allUserEmails.sort((a,b) => parseInt(b.email.internalDate) - parseInt(a.email.internalDate));

    const emailHtmlList = [];
    for (const {email, tokens} of allUserEmails){
        console.log(email.payload.headers.find(e => e.name == 'Delivered-To').value);
        emailHtmlList.push(await readEmail(email, tokens));
    }

    const totalEmails = emailList.length;
    const todayEmails = emailList.filter(e=> {
        const internalDate = parseInt(e.internalDate);
        return internalDate>=today.setHours(0,0,0,0);
    }).length;

    res.send(`
        <h2>Registered Users</h2>
        <ul>${userList}</ul>
        <a href="${url}">Register New User</a>
        <h2>Email List</h2>
        <a href="/fetch">Fetch Email</a>
        <p>
            <b>Total Email:</b> ${totalEmails}
            <br><b>Email Received Today:</b> ${todayEmails}
        </p>

        <ul>${emailHtmlList.join('')}</ul>
    `);
}

async function oauth2callback(req, res){
    const {code} = req.query;
    const {tokens} = await OAuth2Client.getToken(code);
    OAuth2Client.setCredentials(tokens);

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

    res.send(`Registered user: ${emailAddress} | <a href="/">Back to Home</a>`);
}

async function downloadAttachment(req, res){
    const {messageId, attachmentId, filename} = req.query;
    if(!messageId || !attachmentId || !filename){
        return res.status(400).send('Missing parameters');
    }

    try{
        const response = await gmail.users.messages.attachments.get({
            userId: 'me',
            messageId: messageId,
            id: attachmentId
        });

        const data = Buffer.from(response.data.data, 'base64');

        res.set({
            'Content-Type': 'application/cotet-stream',
            'Content-Disposition': `attachment; filename="${filename}"`
        });

        res.send(data);
    } catch (err) {
        console.error(err);
        res.status(500).send('Error downloading attachment');
    }
}

async function fetchEmails(){
    const users = loadTokens();

    for(const user of users){
        OAuth2Client.setCredentials(user.tokens);

        if(OAuth2Client.isTokenExpiring && OAuth2Client.isTokenExpiring()){
            const {credentials} = await OAuth2Client.refreshAccessToken();
            OAuth2Client.setCredentials(credentials);
            user.tokens = credentials;
            saveTokens(users);
        }

        const response = await gmail.users.messages.list({
            userId:'me',
            q: timeRange
        });

        const messages = response.data.messages;

        if(!messages){
            return 'There are no messages';
        }

        let savedEmails = loadEmails();

        for(const message of messages){
            const duplicate = savedEmails.find(e => e.id === message.id);
            if(duplicate){
                console.log(`Skipping duplicate messageId: ${message.id} = ${duplicate.id}`);
                continue;
            }

            const messageInfo = await gmail.users.messages.get({
                userId: 'me',
                id: message.id
            });
            savedEmails.push(messageInfo.data);
        }

        saveEmails(savedEmails);
    }

    return 'Email fetched successfully';
}

async function fetchRoute(req, res){
    const result = await fetchEmails();
    console.log(result);
    res.redirect('/');
}

async function removeUser(req, res){
    const {email} = req.query;
    let users = loadTokens();
    users = users.filter(user => user.email !== email);
    saveTokens(users);
    res.send(`Remove user: ${email} | <a href="/">Back to Home</a>`);
}

async function readEmail(email, tokens){
    OAuth2Client.setCredentials(tokens);
    
    const from = email.payload.headers.find(e=>e.name=='From').value;
    const to = email.payload.headers.find(e=>e.name=='To').value;
    const subject = email.payload.headers.find(e=>e.name=='Subject').value;
    const snippet = email.snippet;
    const date = email.payload.headers.find(e=>e.name=='Date').value;

    const parts = email.payload.parts || [];
    let attachments = [];
    for(const part of parts){
        if(part.filename && part.filename.length>0){
            let attachmentId = part.body.attachmentId;
            const data = await readAttachment(email.id, attachmentId);
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

    attachmentsContent = attachments.map((a) => `
        <b>Filename: </b> ${a.filename} |
        <a href='/download?messageId=${email.id}&attachmentId=${a.attachmentId}&filename=${a.filename}' download> Download </a>
        <br><b>Attachment Preview:</b>
        <br>${a.content}<br>
    `).join('');

    return `
        <li>
            <b>From</b> ${from} <b>To</b> ${to} | <b>Subject:</b> ${subject}
            <br><b>Snippet:</b> 
            <br>${snippet}
            ${attachmentsContent ? `<br>${attachmentsContent}` : `<br>`}
            <b>Date:</b> ${date}
        </li> <br>
    `;
}

async function readAttachment(messageId, attachmentId){
    const response = await gmail.users.messages.attachments.get({
        userId: 'me',
        messageId: messageId,
        id: attachmentId
    });
    
    const data = response.data.data;
    return Buffer.from(data, 'base64');
}

module.exports = {homePage, oauth2callback, fetchEmails, downloadAttachment, fetchRoute, removeUser};