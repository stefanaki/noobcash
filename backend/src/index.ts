import config from './config';
import Node from './entities/node.entity';
import logger from './utilities/logger';
import express, { Request, Response } from 'express';
import Transaction from './entities/transaction.entity';
import BootstrapNode from './entities/bootstrap-node.entity';
import IBlock from './interfaces/block.interface';
import INode from './interfaces/node.interface';
import ITransaction from './interfaces/transaction.interface';

const app = express();
let node: Node;

if (config.isBootstrap) node = new BootstrapNode();
else node = new Node();

// REST endpoints

// Healthcheck
app.get('/healthcheck', (_, res: Response) => {
	logger.info(`Hello from node ${config.node}`);
	res.status(200).json({ message: 'OK' });
});

// Connect node to ring
app.post('/connect', () => {});

// Initialize chain and node information
app.post(
	'/blockchain',
	(
		req: Request<any, any, { genesisBlock: IBlock; nodes: INode[] }>,
		res: Response
	) => {}
);

// Get all transactions
app.get('/transaction', (_, res: Response) => {});

// Create new transaction
app.post(
	'/transaction',
	(req: Request<any, any, { transaction: ITransaction }>, res: Response) => {}
);

// Get wallet balance
app.get('/balance', (_, res: Response) => {
	
})

if (config.node === 8) node.broadcast('GET', 'healthcheck');

const t = new Transaction({
	senderAddress: node.wallet.publicKey,
	receiverAddress: '321',
	amount: 5,
	transactionInputs: [],
	transactionOutputs: []
});

logger.warn(Transaction.verifySignature(t));
Transaction.signTransaction(t, node.wallet.privateKey);
logger.warn(Transaction.verifySignature(t));

logger.info(t);

app.listen(config.port, () =>
	logger.info(
		`Node ${config.node} started listening on ${config.url}:${config.port}...`
	)
);
