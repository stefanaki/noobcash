import config from './config';
import Node from './entities/node.entity';
import logger from './utilities/logger';
import express, { Request, Response } from 'express';
import BootstrapNode from './entities/bootstrap-node.entity';
import IBlock from './interfaces/block.interface';
import INode from './interfaces/node.interface';
import ITransaction from './interfaces/transaction.interface';

const app = express();
const node: Node = config.isBootstrap ? new BootstrapNode() : new Node();

app.use(express.json());

// REST endpoints

// Healthcheck
app.get('/healthcheck', (_, res: Response) => {
	logger.info(`Hello from node ${config.node}`);
	res.status(200).json({ message: 'OK' });
});

// Connect node to ring (only bootstrap node exposes this endpoint)
if (node instanceof BootstrapNode) {
	app.post('/node', async (req: Request<any, any, { node: INode }>, res: Response) => {
		await node.insertNodeToRing(req.body.node);
		logger.warn(node.ring);
		res.status(200).json({ nodeId: node.ring.length - 1 });
	});
}

// Update info of all nodes
app.post('/ring', (req: Request<any, any, { ring: INode[] }>, res: Response) => {
	try {
		node.setRing(req.body.ring);
		logger.info(`Node ${node.ring[node.ring.length - 1].index} connected to ring!`);
		res.status(200).send('OK');
	} catch (e) {
		const error = e as Error;
		logger.error(error.message);
		res.status(400).json({ message: error.message });
	}
});

// Initialize blockchain with genesis block
app.post('/blockchain', (req: Request<any, any, { genesisBlock: IBlock }>, res: Response) => {
	node.initializeBlockchain(req.body.genesisBlock);
});

// Get all transactions
app.get('/transaction', (_, res: Response) => {});

// Create new transaction
app.post(
	'/transaction',
	async (req: Request<any, any, { recipientId: number; amount: number }>, res: Response) => {
		try {
			await node.createTransaction(req.body.recipientId, req.body.amount);
			res.status(200).json({ message: 'OK' });
		} catch (e) {
			const error = e as Error;
			logger.warn(error.message);
			res.status(400).json({ message: error.message });
		}
	}
);

// Broadcast new transaction for validation
app.put('/transaction', (req: Request<any, any, { transaction: ITransaction }>, res: Response) => {
	try {
		node.insertTransaction(req.body.transaction);
		res.status(200).json({ message: 'OK' });
	} catch (e) {
		const error = e as Error;
		logger.warn(error.message);
		res.status(400).json({ message: error.message });
	}
});

// Get wallet balance
app.get('/balance', (_, res: Response) => {
	res.status(200).json({ balance: node.getWalletBalance() });
});

app.listen(config.port, () => logger.info(`Started listening on ${config.url}:${config.port}`));
