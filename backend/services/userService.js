import User from '../models/User.js';

async function getAllUsers(){
    return await User.find();
}

async function findUser(email){
    return await User.findOne({email: email});
}

async function addUser(userData){
    const user = new User(userData);
    await user.save();
    return user;
}

async function updateUser(email, newTokens){
    return await User.findOneAndUpdate(
        {email: email},
        {$set: {tokens: newTokens}}
    );
}

async function deleteUser(email){
    return await User.findOneAndDelete({email});
}

export {getAllUsers, addUser, updateUser, deleteUser, findUser};