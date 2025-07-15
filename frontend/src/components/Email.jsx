import {useEffect, useState} from 'react';
import emailService from '../services/emailService';

const Email = () =>{
    
    const [emails, setEmails] = useState([]);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [previewed, setPreviewed] = useState(null);
    const [todayCount, setTodayCount] = useState(0);
    const [allTimeCount, setAllTimeCount] = useState(0);
    const [warning, setWarning] = useState('');

    useEffect(() => {
        console.log('useEffect triggered');
        handleFindEmails();
    }, []);

    const handleFindEmails = async (start, end) => {
        try {
            let response;
            if(start || end){
                if (!start) start = new Date(0);
                else start = new Date(start);

                if (!end) {
                    end = new Date();
                    end.setDate(end.getDate() + 1);
                } else {
                    end = new Date(end);
                }

                start = start.getTime();
                end = end.getTime();
                response = await emailService.filterEmailByTime(start, end); 
            } else {
                response = await emailService.getAllEmail();
            }
            
            response.sort((a,b) => new Date(b.date) - new Date(a.date));
            setEmails(response);

            setAllTimeCount(response.length);
            const today = new Date();
            today.setHours(0,0,0,0);
            const tmr = new Date(today);
            tmr.setDate(tmr.getDate() + 1);
            const todayMillis = today.getTime();
            const tmrMillis = tmr.getTime();
            const todayEmails = response.filter(email => {
                const emailDate = new Date(email.date).getTime();
                return emailDate >= todayMillis && emailDate < tmrMillis;
            });
            setTodayCount(todayEmails.length);
            console.log(todayCount + allTimeCount)
        } catch (error) {
            console.error('Error handleFindEmail',error);
        }
    }

    const handleDownloadList = async (start, end) => {
        try {
            if (!start) start = new Date(0);
            else start = new Date(start);
            if (!end) {
                end = new Date();
                end.setDate(end.getDate() + 1);
            } else {
                end = new Date(end);
            }

            start = start.getTime();
            end = end.getTime();

            await emailService.downloadZipAttachment(start, end);
        } catch (error) {
            console.error('Error handleDownloadList', error);
        }
    }

    const handleDownload = async (attachmentId, filename) => {
        try {
            console.log('tried down')
            await emailService.downloadAttachment(attachmentId, filename);
            console.log('finish down')
        } catch (error) {
            console.error('Error handleDownload', error);
        }
    }

    const handlePreviewContent = async (content, filename) => {
        console.log('try handle read')
        try{
            const text = await emailService.readAttachmentContent(content, filename);
            setPreviewed({text, filename});
        } catch(err) {
            setPreviewed({text: '[Error reading content]'});
        }
    };

    const handleFetchEmail = async (start, end) => {
        try {
            if(!start || !end){
                setWarning('Both Start Date and End Date are required for fetching!');
                setTimeout(() => setWarning(''), 5000);
                return;
            } else {
                setWarning('');
                await emailService.fetchNewEmail(start, end);
            }
        } catch (error) {
            console.error('Error handleFetchEmail', error);
        } finally {
            handleFindEmails();
        }
        
    }

    const handleDeleteEmails = async (start, end) => {
        try {
            if (!start || !end) {
                setWarning('Both Start Date and End Date are required for deletion!');
                setTimeout(() => setWarning(''), 5000);
                return;
            }

            const startMillis = new Date(start).getTime();
            const endDateObj = new Date(end);
            endDateObj.setDate(endDateObj.getDate() + 1); 
            const endMillis = endDateObj.getTime();

            const emailsToDelete = emails.filter(email => {
                const emailTime = new Date(email.date).getTime();
                return emailTime >= startMillis && emailTime < endMillis;
            });

            for (const email of emailsToDelete) {
                await emailService.deleteEmail(email.id);
            }

            await handleFindEmails(); // Refresh
        } catch (err) {
            console.error('Error handleDeleteEmails', err);
        }
    }
    
    const handleDeleteEmail = async (id) => {
        try {
            await emailService.deleteEmail(id);
            await handleFindEmails();
        } catch (error) {
            console.error('Error handleDeleteEmail')
        }
    }

    return (
        <div className='emailContainer'>
            <div className='emailTitleBox'>
                <h2>Email List</h2>
                <p>Today: {todayCount} | All time: {allTimeCount}</p>
            </div>
            <div className='emailUtils'>
                <div className='timeBox'>
                    <b>Start:</b> <input 
                        type="date" 
                        value={startDate}
                        onChange={e => setStartDate(e.target.value)}
                        placeholder='Start Date'
                    />
                    <b>End:</b> <input 
                        type="date" 
                        value={endDate}
                        onChange={e => setEndDate(e.target.value)}
                        placeholder='End Date'
                    />
                </div>
                
                <button onClick={() => handleFindEmails(startDate, endDate)} className='utilBtn'>Filter</button>
                <button onClick={() => handleDownloadList(startDate, endDate)} className='utilBtn'>Download All</button>
                <button onClick={() => handleFetchEmail(startDate, endDate)} className='utilBtn'>Fetch New Emails</button>
                <button onClick={() => handleDeleteEmails(startDate, endDate)} className='utilBtn'>Delete Emails</button>
            </div>
            {warning && (
                <div className='warnings'>
                    <h3>{warning}</h3>
                </div>
            )}
            <div className='emailList'>
                {emails.map((email) => (
                    <div className='emailBox'>
                        <div className='emailBoxHeader'>
                            <p><b>From:</b> {email.from} <b>To:</b> {email.to}</p>
                            <button 
                                className='deleteEmailBtn' 
                                onClick={() => handleDeleteEmail(email.id)}
                            >
                                Delete
                            </button>
                        </div>
                        <p><b>Subject:</b> {email.subject} </p>
                        <p><b>Snippet:</b> <br /> {email.snippet}</p> 
                        <p className='attachmentWrap'>
                            {email.attachments?.map((attachment) => (
                                <div className='attachmentContent'>
                                    <div className='attachInfo'>
                                        <b>Filename:</b> {attachment.filename}
                                    </div>
                                    <div className='attachBtn'>
                                        <button onClick={() => handlePreviewContent(attachment.content, attachment.filename)}>Preview Content</button>
                                        <button onClick={() => handleDownload(attachment.attachmentId, attachment.filename)}>Download</button>
                                    </div>
                                </div>
                            ))}
                        </p>
                        <p><b>Date: </b>{email.date}</p>
                    </div>
                ))}
            </div>
            {previewed && (
                <div className='backDropScreen' onClick={() => setPreviewed(null)}>
                    <div className='previewContent' onClick={(e) => e.stopPropagation()}>
                        <p><b>{previewed.filename}</b></p>
                        <p>{previewed.text}</p>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Email;