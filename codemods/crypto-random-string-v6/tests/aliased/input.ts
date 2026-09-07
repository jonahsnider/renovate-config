import {cryptoRandomStringAsync as generateToken, type Options} from 'crypto-random-string';

export const token = await generateToken({length: 16} satisfies Options);
