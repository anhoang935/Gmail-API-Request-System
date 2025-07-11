import axios from "axios";

const BASE_URL = process.env.REACT_APP_BACKEND_URL;

const emailService = {
    getAllEmail: async () => {
        try {
            const response = await axios.get(`${BASE_URL}/emails`);
            return response.data;
        } catch (error) {
            console.error(error);
            throw error;
        }
    }
} 

export default emailService;