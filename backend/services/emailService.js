import Email from '../models/Email.js';

async function getAllEmails(){
    return await Email.find();
}

async function addEmail(emailData){
    const email = new Email(emailData);
    await email.save();
    return email;
}

async function findEmail(id){
    const email = await Email.findOne({id: id});
    return email;
}

async function findEmailByAttachmentID(id){
    const email = await Email.findOne({"attachments.attachmentId": id});
    return email;
}

async function findEmailByTimeRange(start, end){
    const email = await Email.find({
        internalDate: {
            $gte: String(start),
            $lte: String(end)
        }
    });
    return email;
}

async function deleteEmail(id){
    const email = await Email.findOneAndDelete({id: id});
    return email;
}

export {getAllEmails, addEmail, findEmail, findEmailByAttachmentID, findEmailByTimeRange, deleteEmail};