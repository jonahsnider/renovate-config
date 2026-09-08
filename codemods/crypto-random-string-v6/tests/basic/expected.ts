import cryptoRandomString from 'crypto-random-string';

export const value = cryptoRandomString({length: 16});
export const generateValue = () => cryptoRandomString({length: 8});
