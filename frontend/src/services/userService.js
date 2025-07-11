import axios from "axios";

const BASE_URL = process.env.REACT_APP_BACKEND_URL;

const userService = {
    addUser: () => {
        window.location.href = `${BASE_URL}/oauth2callback`;
    },
    removeUser: async (email) => {
        try{
            await axios.delete(`${BASE_URL}/user`,{
                params: {email}
            });
        } catch(err) {
            console.error('Error removing user', err);
            throw err;
        }
    },
    findAllUser: async () => {
        try{
            const response = await axios.get(`${BASE_URL}/users`);
            return response.data;
        } catch(err) {
            console.error('Error getting all users', err);
            throw err;
        }
    }
}

export default userService;