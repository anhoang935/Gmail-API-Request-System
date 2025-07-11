import { generateHome } from '../services/homeService.js';
import { fetchEmails, exchangeCodeForToken } from '../services/gmailService.js';
import { findUser, updateUser, addUser, deleteUser } from '../services/userService.js';
import { findEmailByAttachmentID } from '../services/emailService.js';

async function homePage(req, res){
    try{
        const homeHtml = await generateHome();
        res.send(homeHtml); 
    } catch (err) {
        console.error(err);
        res.status(500).send('Error loading homepage');
    }
}

async function fetchRoute(req, res){
    try{
        await fetchEmails();
        res.redirect('/');
    } catch(err) {
        console.error(err);
        res.status(500).send('Error fetching emails');
    }
}

async function oauth2callback(req, res){
    try{
        const {code} = req.query;
        const userData = await exchangeCodeForToken(code);

        const existing = await findUser(userData.email);
        if(existing){
            await updateUser(userData.email, userData.tokens);
        } else {
            await addUser(userData);
        }

        res.send(`Registered user: ${userData.email} | <a href="/">Back to Home</a>`);
    } catch (err){
        console.log(err);
        res.status(500).send('Error completing OAuth2 callback');
    }
}

async function downloadAttachment(req, res){
    try{
        const {attachmentId, filename} = req.query;
        if(!attachmentId || !filename){
            return res.status(400).send('Missing parameters');
        }

        const email = await findEmailByAttachmentID(attachmentId);
        const attachment = email.attachments.find(att => att.attachmentId === attachmentId);
        const data = attachment.content;

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

async function removeUser(req, res){
    try{
        const {email} = req.query;
        await deleteUser(email); 
        res.send(`Remove user: ${email} | <a href="/">Back to Home</a>`);
    } catch(err) {
        console.error(err);
        res.status(500).send('Error removing user');
    }
}


export { homePage, fetchRoute, oauth2callback, downloadAttachment, removeUser };
