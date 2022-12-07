import { config } from 'dotenv';

config();

export default {
    node: process.env.NODE_INDEX ?? -1,
    isBootstrap: true,
    difficulty: 5,
    numOfNodes: 10,
    url: 'http://192.168.0.1',
    port: '3000',
    blockCapacity: 5,
    passphrase: '123'
} 