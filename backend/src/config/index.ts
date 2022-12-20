import { config } from 'dotenv';

config();

export default {
	node: Number(process.env.NODE_INDEX) || 1,
	isBootstrap: process.env.IS_BOOTSTRAP === 'true',
	difficulty: Number(process.env.DIFFICULTY) || 5,
	numOfNodes: 10,
	url: process.env.URL ?? 'http://192.168.0.1',
	port: process.env.PORT ?? '3000',
	blockCapacity: Number(process.env.BLOCK_CAPACITY) || 5,
	passphrase: process.env.PASSPHRASE ?? 'dev',
	isProduction: process.env.IS_PRODUCTION === 'true'
};
