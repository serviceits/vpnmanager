const crypto = require('crypto'); 

// // Функция для шифрования данных
// const encrypt = (plaintext, key, nonce) => {
//     const cipher = crypto.createCipheriv('chacha20-poly1305', key, nonce);
//     let encrypted = cipher.update(plaintext, 'utf8', 'hex');
//     encrypted += cipher.final('hex');
//     const tag = cipher.getAuthTag().toString('hex');
//     return `${nonce.toString('hex')}:${tag}:${encrypted}`;
// };

// // Функция для расшифровки данных
// const decrypt = (ciphertext, key) => {
//     const [nonceHex, tagHex, encryptedHex] = ciphertext.split(':');
//     const nonce = Buffer.from(nonceHex, 'hex');
//     const tag = Buffer.from(tagHex, 'hex');
//     const encrypted = Buffer.from(encryptedHex, 'hex');

//     const decipher = crypto.createDecipheriv('chacha20-poly1305', key, nonce);
//     decipher.setAuthTag(tag);
//     let decrypted = decipher.update(encrypted, 'hex', 'utf8');
//     decrypted += decipher.final('utf8');
//     return decrypted;
// };

const encrypt = (plaintext, key, iv) => {
    const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
    let encrypted = cipher.update(plaintext, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return `${iv.toString('hex')}:${encrypted}`;
};

// Функция для расшифровки данных
const decrypt = (ciphertext, key) => {
    const [ivHex, encryptedHex] = ciphertext.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    const encrypted = Buffer.from(encryptedHex, 'hex');

    const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
};

module.exports = {
    encrypt,
    decrypt
}