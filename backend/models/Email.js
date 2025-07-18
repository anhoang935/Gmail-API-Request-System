import mongoose from 'mongoose';

const EmailSchema = new mongoose.Schema({
    id: {type: String, require: true},
    internalDate: {type: String, require: true},
    from: {type: String, require: true},
    to: {type: String, require: true},
    subject: String,
    snippet: String,
    date: {type: String, require: true},
    attachments: [{
        attachmentId: String,
        filename: String,
        mimeType: String,
        content: Buffer    
    }]
})

export default mongoose.model('Email', EmailSchema);