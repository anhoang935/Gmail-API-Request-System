const {getAllUsers} = require('./userService');
const {getAllEmails} = require('./emailService');
const {fetchEmails, generateAuthUrl} = require('./gmailService');
const {parseDocx, parsePdf} = require('./attachmentService');

async function generateHome(){
    await fetchEmails();

    const users = await getAllUsers();
    const userList = users.map(u => 
        `<li>
            ${u.email}
            <a href="/removeUser?email=${u.email}"> Remove </a>
        </li>`).join('');

    const url = await generateAuthUrl();    

    const emailHtmlList = await readEmail();
    
    const emailList = await getAllEmails();
    const totalEmails = emailList.length;
    const todayMidnight = new Date().setHours(0,0,0,0);
    const todayEmails = emailList.filter(e=>
        parseInt(e.internalDate) >= todayMidnight 
    ).length;

    return`
        <h2>Registered Users</h2>
        <ul>${userList}</ul>
        <a href="${url}">Register New User</a>
        <h2>Email List</h2>
        <a href="/fetch">Fetch Email</a>
        <p>
            <b>Total Email:</b> ${totalEmails}
            <br><b>Email Received Today:</b> ${todayEmails}
        </p>

        <ul>${emailHtmlList}</ul>
    `;
}

async function readEmail(){
    const emails = (await getAllEmails()).sort(
        (a,b) => b.internalDate - a.internalDate
    );
    let emailHtmlList = ``;
    for(const email of emails){
        let attachmentsContent = ``;
        let attachments = email.attachments;
        for(const attachment of attachments){
            let parsedText = '[Content Type Not Supported]';
            if(attachment.filename.endsWith('docx')){
                parsedText = await parseDocx(attachment.content);
            } else if (attachment.filename.endsWith('pdf')){
                parsedText = await parsePdf(attachment.content);
            }

            attachmentsContent += `
                <b>Filename: </b> ${attachment.filename} |
                <a href='/download?&attachmentId=${attachment.attachmentId}&filename=${attachment.filename}' download> Download </a>
                <br><b>Attachment Preview:</b>
                <br>${parsedText}<br>
            `;
        }

        emailHtmlList += `
            <li>
                <b>From</b> ${email.from} <b>To</b> ${email.to} | <b>Subject:</b> ${email.subject}
                <br><b>Snippet:</b> 
                <br>${email.snippet}
                ${attachmentsContent ? `<br>${attachmentsContent}` : `<br>`}
                <b>Date:</b> ${email.date}
            </li> <br>
        `;
    }

    return emailHtmlList;
}

module.exports = {generateHome, readEmail};