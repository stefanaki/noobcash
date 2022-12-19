import config from './config';
// import Wallet from './entities/wallet.entity';
import Node from './entities/node.entity';
import logger from './utilities/logger';


console.log(config);

new Node();
console.log("hello world");


logger.info(`MY IP is ${config.url}:${config.port} for real`);
