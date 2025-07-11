import { useState } from "react";
import userService from "./services/userService";

const User = () => {

    const [users, setUsers] = useState([]);

    const handleRegisterUser = async () => {
        userService.addUser();
    }

    const handleFindUsers = async () => {
        try{
            const response = await userService.findAllUser();
            setUsers(response);
        } catch(err) {
            console.error('Error handleFindUsers', err);
        }
    }

    const handleDeleteUser = async (email) => {
        try {
            await userService.removeUser(email);
        } catch (error) {
            console.error('Error handleDeleteUser', error);
        }
    }

    const userList = () => {
        handleFindUsers();

        return users.map((user) => (
            <li>
                {user.email}
                <button onClick={handleDeleteUser(user.email)}>Delete User</button>
            </li>
        ));
    }

    return (
        <div className="userContainer">
            <h2>Registered Users</h2>
            <button onClick={handleRegisterUser}>Register New User</button>
        </div>
    );
}