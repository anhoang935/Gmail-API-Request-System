const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    email: {type: String, required: true},
    tokens: {type: Object, required: true}
});

module.exports = mongoose.model('User', UserSchema);