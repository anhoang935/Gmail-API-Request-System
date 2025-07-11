import { getAllUsers, deleteUser, findUser, updateUser, addUser } from '../services/userService.js';
import { exchangeCodeForToken } from '../services/gmailService.js';

async function findAllUsers(req, res){
    try {
        const users = await getAllUsers();
        return users;
    } catch (err){
        console.error(err);
        res.status(500).send('Error getting all users');
    }
}

async function removeUser(req, res){
    try{
        const {email} = req.query;
        await deleteUser(email); 
    } catch(err) {
        console.error(err);
        res.status(500).send('Error removing user');
    }
}

async function registerUser(req, res){
    try{
        const {code} = req.query;
        const userData = await exchangeCodeForToken(code);

        const existing = await findUser(userData.email);
        if(existing){
            await updateUser(userData.email, userData.tokens);
        } else {
            await addUser(userData);
        }
        
    } catch (err){
        console.log(err);
        res.status(500).send('Error completing OAuth2 callback');
    }
}

export {findAllUsers, removeUser, registerUser};