import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
    email: {type: String, required: true},
    tokens: {type: Object, required: true}
});

export default mongoose.model('User', UserSchema);