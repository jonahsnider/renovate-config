import cryptoRandomString, {cryptoRandomStringAsync} from 'crypto-random-string';

export const syncValue = cryptoRandomString({length: 8});
export const asyncValue = await cryptoRandomStringAsync({length: 16});
