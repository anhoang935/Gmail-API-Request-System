import mammoth from 'mammoth';
import pdfParse from 'pdf-parse';

async function parseDocx(buffer){
    const data = await mammoth.extractRawText({buffer});
    return data.value;
}

async function parsePdf(buffer){
    const data = await pdfParse(buffer);
    return data.text;
}

export {parseDocx, parsePdf};