import axios from "axios";
const BASE_URL = process.env.REACT_APP_BACKEND_URL;

const emailService = {
    getAllEmail: async () => {
        try {
            const response = await axios.get(`${BASE_URL}/emails`);
            console.log('Did tried get email')
            return response.data;
        } catch (error) {
            console.error(error);
            throw error;
        }
    },
    filterEmailByTime: async (start, end) => {
        try {
            const response = await axios.get(`${BASE_URL}/emails/timeRange`,{
                params: {start, end}
            });
            return response.data; 
        } catch (error) {
            console.error(error);
            throw error;
        }
    },
    downloadZipAttachment: async (start, end) => {
        try{
            console.log('try zip front')
            const response = await axios.get(`${BASE_URL}/downloadZip`,{
                params: {start, end},
                responseType: 'blob'  // 
            });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'attachments.zip'); 
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch(err){
            console.error(err);
            throw err;
        }
    },
    downloadAttachment: async (attachmentId, filename) => {
        try {
            console.log('tried call down')
            const response = await axios.get(`${BASE_URL}/download`,{
                params: {attachmentId, filename},
                responseType: 'blob'
            });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', filename);
            document.body.appendChild(link);
            link.click();
            link.remove();
            console.log('finish call down')
        } catch (error) {
            console.error(error);
            throw error;
        }
    },
    readAttachmentContent: async (content, filename) => {
        try {
            console.log('Start trying read serv')
            const response = await axios.post(`${BASE_URL}/readAttachment`,{
                content, filename
            })
            console.log('Finish trying')
            console.log(response);
            return response.data;
        } catch (error) {
            console.error(error);
            throw error;
        }
    },
    fetchNewEmail: async (start, end) => {
        try{
            await axios.post(`${BASE_URL}/fetch`, {
                start, end
            })
        } catch(err) {
            console.error(err);
            throw err;
        }
    },
    deleteEmail: async (id) => {
        try {
            await axios.delete(`${BASE_URL}/email/${id}`);
        } catch (error) {
            console.error(error);
            throw error;
        }
    }
} 

export default emailService;