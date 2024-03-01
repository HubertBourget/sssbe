const crypto = require('crypto');

function encryptJSON(jsonObj) {
    const jsonString = JSON.stringify(jsonObj);

    const cipher = crypto.createCipher('aes-256-cbc', process.env.CARD_ENCRYPTION_KEY);

    let encryptedData = cipher.update(jsonString, 'utf-8', 'hex');
    encryptedData += cipher.final('hex');

    return encryptedData;
}

function decryptJSON(encryptedData) {
    const decipher = crypto.createDecipher('aes-256-cbc', process.env.CARD_ENCRYPTION_KEY);

    let decryptedData = decipher.update(encryptedData, 'hex', 'utf-8');
    decryptedData += decipher.final('utf-8');

    return JSON.parse(decryptedData);
}

module.exports = {encryptJSON, decryptJSON}