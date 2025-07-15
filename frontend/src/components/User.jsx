import { useEffect, useState } from "react";
import userService from "../services/userService";

const User = () => {

    const [users, setUsers] = useState([]);

    useEffect(()=>{
        handleFindUsers();
    }, []);

    const handleRegisterUser = async () => {
        userService.addUser();
    }

    const handleFindUsers = async () => {
        try{
            const response = await userService.findAllUser();
            if(response){
                setUsers(response)
            } else {
                setUsers([])
            }
        } catch(err) {
            console.error('Error handleFindUsers', err);
            setUsers([]);
        }
    }

    const handleDeleteUser = async (email) => {
        try {
            await userService.removeUser(email);
            handleFindUsers();
        } catch (error) {
            console.error('Error handleDeleteUser', error);
        }
    }

    return (
        <div className="userContainer">
            <div className="userTitleBox">
                <h2>User List</h2>
                <button onClick={() => handleRegisterUser()}>Register New User</button>
            </div>
            <ul className="userList">
                {users?.map((user, index) => (
                    <li key={index}>
                        {user.email}
                        <button onClick={() => handleDeleteUser(user.email)}>Delete User</button>
                    </li>
                ))}
            </ul>
        </div>
    );
}

export default User;