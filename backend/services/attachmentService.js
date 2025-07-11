const mammoth = require('mammoth');
const pdfParse = require('pdf-parse');

async function parseDocx(buffer){
    const data = await mammoth.extractRawText({buffer});
    return data.value;
}

async function parsePdf(buffer){
    const data = await pdfParse(buffer);
    return data.text;
}

module.exports = {parseDocx, parsePdf};