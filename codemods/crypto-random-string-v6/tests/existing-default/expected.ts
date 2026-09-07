import cryptoRandomString from 'crypto-random-string';

export const syncValue = cryptoRandomString({length: 8});
export const asyncValue = cryptoRandomString({length: 16});
