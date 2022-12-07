import config from './config';
// import Wallet from './entities/wallet.entity';
import Node from './entities/node.entity';

// logger.silly('I am a silly log.');
// logger.trace('I am a trace log.');
// logger.debug('I am a debug log.');
// logger.info('I am an info log.');
// logger.warn('I am a warn log with a json object:', { foo: 'bar' });
// logger.error('I am an error log.');
// logger.fatal(new Error('I am a pretty Error with a stacktrace.'));

console.log(config);
// const w = new Wallet();
// console.log(w)

const n = new Node();
console.log(n);
