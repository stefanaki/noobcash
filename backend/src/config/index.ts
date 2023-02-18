import { config } from 'dotenv';

config();

export default {
    node: Number(process.env.NODE_INDEX ?? 0),
    isBootstrap: process.env.IS_BOOTSTRAP === 'true',
    difficulty: Number(process.env.DIFFICULTY ?? 5),
    numOfNodes: Number(process.env.NUM_NODES ?? 5),
    url: process.env.URL ?? 'http://192.168.0.10',
    port: process.env.PORT ?? '3000',
    blockCapacity: /**Number(process.env.BLOCK_CAPACITY ?? 5) */ 10,
    passphrase: process.env.PASSPHRASE ?? 'dev',
    bootstrapUrl: process.env.BOOTSTRAP_URL ?? 'http://192.168.0.10',
    bootstrapPort: process.env.BOOTSTRAP_PORT ?? '3000',
};
