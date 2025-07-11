import { getAllEmails } from '../services/emailService';

async function findAllEmail(req, res){
    try {
        const emails = await getAllEmails();
        return emails;
    } catch(err) {
        console.error(err);
        res.status(500).send('Error getting all email');
    }
}

export {findAllEmail};