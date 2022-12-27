import config from './config';
import Node from './entities/node.entity';
import logger from './utilities/logger';
import express, { Request, Response } from 'express';
import BootstrapNode from './entities/bootstrap-node.entity';
import IBlock from './interfaces/block.interface';
import INode from './interfaces/node.interface';
import ITransaction from './interfaces/transaction.interface';

const app = express();
let node: Node;

if (config.isBootstrap) {
	node = new BootstrapNode();
} else {
	node = new Node();
}

// REST endpoints

// Healthcheck
app.get('/healthcheck', (_, res: Response) => {
	logger.info(`Hello from node ${config.node}`);
	res.status(200).json({ message: 'OK' });
});

// Connect node to ring
app.post(
	'/ring',
	(req: Request<any, any, { nodeInfo: INode; publicKey: string }>, res: Response) => {}
);

// Initialize chain and node information
app.post(
	'/blockchain',
	(req: Request<any, any, { genesisBlock: IBlock; nodes: INode[] }>, res: Response) => {}
);

// Get all transactions
app.get('/transaction', (_, res: Response) => {});

// Create new transaction
app.post(
	'/transaction',
	(req: Request<any, any, { transaction: ITransaction }>, res: Response) => {}
);

// Get wallet balance
app.get('/balance', (_, res: Response) => {});

if (config.node === 8) setTimeout(() => node.broadcast('GET', 'healthcheck'), 5000);

app.listen(config.port, () => logger.info(`Started listening on ${config.url}:${config.port}`));
