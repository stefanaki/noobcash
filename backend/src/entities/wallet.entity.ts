import IWallet from '../interfaces/wallet.interface';
import { generateKeyPairSync } from 'crypto';
import config from '../config';
import logger from '../utilities/logger';

export default class Wallet implements IWallet {
    publicKey: string;
    privateKey: string;

    constructor() {
        try {
            const keyPair = generateKeyPairSync('rsa', {
                modulusLength: 1024,
                publicExponent: 0x10101,
                publicKeyEncoding: {
                    type: 'pkcs1',
                    format: 'pem',
                },
                privateKeyEncoding: {
                    type: 'pkcs8',
                    format: 'pem',
                    cipher: 'aes-192-cbc',
                    passphrase: config.passphrase,
                },
            });

            this.publicKey = keyPair.publicKey;
            this.privateKey = keyPair.privateKey;

            logger.info('RSA pair created');
        } catch (error) {
            logger.error(error);
            throw error;
        }
    }
}
