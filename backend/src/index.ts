import config from './config';
import Node from './entities/node.entity';
import logger from './utilities/logger';
import express from 'express';
import Transaction from './entities/transaction.entity';

const app = express();

app.get('/healthcheck', (req, res) =>
	logger.info(`Hello from node ${config.node}`)
);

const node = new Node();

if (config.node === 8) node.broadcast('GET', 'healthcheck');

const t = new Transaction({
	senderAddress: node.wallet.publicKey,
	receiverAddress: "321",
	amount: 5,
	transactionInputs: [],
	transactionOutputs: []
});

logger.warn(Transaction.verifySignature(t));
Transaction.signTransaction(t, node.wallet.privateKey);
logger.warn(Transaction.verifySignature(t));

logger.info(t);

app.listen(config.port, () =>
	logger.info(`Node ${config.node} started listening on port ${config.port}...`)
);
