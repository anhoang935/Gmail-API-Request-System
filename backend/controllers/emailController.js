import { getAllEmails, findEmailByTimeRange, findEmailByAttachmentID, deleteEmail } from '../services/emailService.js';
import archiver from 'archiver';
import { parseDocx, parsePdf } from '../services/attachmentService.js';

async function findAllEmail(req, res){
    try {
        const emails = await getAllEmails();
        res.json(emails);
    } catch(err) {
        console.error(err);
        res.status(500).send('Error getting all email');
    }
}

async function filterEmailByTime(req, res){
    try {
        const {start, end} = req.query;
        const emails = await findEmailByTimeRange(start, end);
        res.json(emails);
    } catch(err) {
        console.error(err);
        res.status(500).send('Error filtering email by time');
    }
}

async function downloadZipAttachment(req, res){
    try{
        console.log('tried zip be')
        const {start, end} = req.query;
        const emails = await findEmailByTimeRange(start, end);
        if(!emails.length){
            return res.status(404).send('No emails found in the given time range');
        }
        res.set({
            'Content-Type': 'application/zip',
            'Content-Disposition': `attachment; filename="attachments.zip"`
        });

        const archive = archiver('zip', {zlib: {level: 9}});
        archive.pipe(res);

        for(const email of emails){
            let attachments = email.attachments;
            if(!attachments) continue;
            for(const attachment of attachments){
                if (!attachment.content || !attachment.filename) continue;
                archive.append(attachment.content, {name: attachment.filename});
            }
        }
        
        await archive.finalize();
        console.log('finish zip be')
    } catch (err) {
        console.error(err);
        res.status(500).send('Error downloading attachment');
    }
}

async function readAttachment(req, res) {
    console.log('Tried read in backend')
    const {content, filename} = req.body;

    if (!content || !filename) {
        return res.status(400).send('Missing content or filename');
    }

    let buffer;
    try {
        buffer = Buffer.from(content, 'base64');
    } catch {
        return res.status(400).send('Invalid content encoding');
    }
    
    let parsedText = '[Content Type Not Supported]';
    try {
        if (filename.endsWith('docx')) {
            parsedText = await parseDocx(buffer);
        } else if (filename.endsWith('pdf')) {
            parsedText = await parsePdf(buffer);
        }

        console.log('finish read be');
        res.send(parsedText);
    } catch (err) {
        console.error('Error while parsing:', err);
        res.status(500).send('Failed to parse attachment');
    }
}

async function removeEmail(req, res){
    try {
        const {id} = req.params;
        await deleteEmail(id);
        res.send('Email deleted');
    } catch (error) {
        console.error('Error while removing id:',error);       
    }
}

export {findAllEmail, filterEmailByTime, downloadZipAttachment, readAttachment, removeEmail};