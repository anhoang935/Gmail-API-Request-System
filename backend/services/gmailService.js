import { google } from 'googleapis';
import { getAllUsers, updateUser } from './userService';
import { findEmail, addEmail } from './emailService';

const OAuth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.REDIRECT_URI
);

const gmail = google.gmail({version: 'v1', auth: OAuth2Client});
const scopes = ['https://www.googleapis.com/auth/gmail.readonly'];

async function exchangeCodeForToken(code){
    const {tokens} = await OAuth2Client.getToken(code);
    OAuth2Client.setCredentials(tokens);

    const profile = await gmail.users.getProfile({userId: 'me'});
    const email = profile.data.emailAddress;
    
    return {email, tokens};
}

async function generateAuthUrl(){
    return OAuth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: scopes,
        prompt: 'consent'
    });
}

async function fetchEmails(){

    const users = await getAllUsers();

    // const today = new Date();
    // const yyyy = today.getFullYear();
    // const mm = String(today.getMonth()+1).padStart(2,'0');
    // const dd = String(today.getDate()).padStart(2,'0');

    const pastDay = new Date();
    pastDay.setDate(pastDay.getDate() - 2);
    const yyyy = pastDay.getFullYear();
    const mm = String(pastDay.getMonth() + 1).padStart(2, '0');
    const dd = String(pastDay.getDate()).padStart(2, '0');

    const timeRange = `after:${yyyy}/${mm}/${dd}`;

    for(const user of users){
        OAuth2Client.setCredentials(user.tokens);

        if(OAuth2Client.isTokenExpiring && OAuth2Client.isTokenExpiring()){
            const {credentials} = await OAuth2Client.refreshAccessToken();
            OAuth2Client.setCredentials(credentials);
            user.tokens = credentials;
            await updateUser(user.email, user.tokens);
        }

        const response = await gmail.users.messages.list({
            userId:'me',
            q: timeRange
        });

        const messages = response.data.messages;

        if(!messages){
            return 'There are no messages';
        }

        for(const message of messages){
            const duplicate = await findEmail(message.id);
            if(duplicate){
                console.log(`Skipping duplicate messageId: ${message.id} = ${duplicate.id}`);
                continue;
            }
            
            const messageInfo = await gmail.users.messages.get({
                userId: 'me',
                id: message.id
            });
            console.log(messageInfo);
            if (!messageInfo.data.payload || !messageInfo.data) {
                console.log(`Skipping message with no payload: ${message.id}`);
                continue;
            }

            let attachments = [];
            const parts = messageInfo.data.payload.parts || [];
            console.log('Part: ',parts);
            for(const part of parts){
                if(part.filename && part.filename.length>0){
                    let attachmentId = part.body.attachmentId;
                    const attachmentData = await readAttachment(messageInfo.data.id, attachmentId);
                    attachments.push({
                        attachmentId: attachmentId,
                        filename: part.filename,
                        mimeType: part.mimeType,
                        content: attachmentData
                    });
                }
            }

            const emailData = {
                id: message.id,
                internalDate: messageInfo.data.internalDate,
                from: extractEmail(messageInfo.data.payload.headers.find(e=>e.name=='From').value),
                to: extractEmail(messageInfo.data.payload.headers.find(e=>e.name=='To').value),
                subject: messageInfo.data.payload.headers.find(e=>e.name=='Subject').value,
                snippet: messageInfo.data.snippet,
                date: messageInfo.data.payload.headers.find(e=>e.name=='Date').value,
                attachments: attachments
            };

            await addEmail(emailData);
        }

    }

    return 'Email fetched successfully';
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

function extractEmail(address){
    const match = address.match(/<(.+)>/);
    if(match){
        return match[1];
    }
    return address.trim();
}

export {fetchEmails, generateAuthUrl, exchangeCodeForToken};