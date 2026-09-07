import {cryptoRandomStringAsync} from 'crypto-random-string';

export const value = await cryptoRandomStringAsync({length: 16});
