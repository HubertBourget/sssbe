const CryptoJS = require('crypto-js')

function encryptData(data){
    return CryptoJS.AES.encrypt(data, process.env.CARD_ENCRYPTION_KEY).toString();
}

function decryptData(encryptedText){
    const bytes = CryptoJS.AES.decrypt(encryptedText, process.env.CARD_ENCRYPTION_KEY);
    return bytes.toString(CryptoJS.enc.Utf8);
}

module.exports = {encryptData, decryptData}
