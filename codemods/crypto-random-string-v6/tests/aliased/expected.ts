import generateToken, {type Options} from 'crypto-random-string';

export const token = generateToken({length: 16} satisfies Options);
