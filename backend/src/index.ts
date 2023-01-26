import config from './config';
import Node from './entities/node.entity';
import logger from './utilities/logger';
import express, { Request, Response } from 'express';
import BootstrapNode from './entities/bootstrap-node.entity';
import INode from './interfaces/node.interface';
import ITransaction, { ITransactionOutput } from './interfaces/transaction.interface';
import IBlockchain from './interfaces/blockchain.interface';
import IBlock from './interfaces/block.interface';

const app = express();
const node: Node = config.isBootstrap ? new BootstrapNode() : new Node();

app.use(express.json());

// REST endpoints

// Connect node to ring (only bootstrap node exposes this endpoint)
if (node instanceof BootstrapNode) {
    app.post('/node', async (req: Request<any, any, { node: INode }>, res: Response) => {
        try {
            await node.insertNodeToRing(req.body.node);
            res.status(200).json({ nodeId: node.ring.length - 1 });
        } catch (e) {
            const error = e as Error;
            res.status(500).json({ message: error.message });
        }
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

// Get Blockchain and UTXO's
app.get('/blockchain', (_, res: Response) => {
    try {
        const { blockchain, utxos, pendingTransactions } = node.getBlockchain();

        res.status(200).json({ blockchain, utxos, pendingTransactions });
    } catch (e) {
        const error = e as Error;
        res.status(400).json({ message: error.message });
    }
});

// Get Blockchain and UTXO's
app.get('/blockchain_test', (_, res: Response) => {
    try {
        const { blockchain } = node.getBlockchain();

        const bl = blockchain.blocks.map(block =>
            block.transactions.map(t => {
                return {
                    sender: node.ring.find(node => node.publicKey === t.senderAddress)?.index,
                    recv: node.ring.find(node => node.publicKey === t.receiverAddress)?.index,
                    amount: t.amount,
                    timestamp: t.timestamp,
                };
            }),
        );

        res.status(200).json({ bl });
    } catch (e) {
        const error = e as Error;
        res.status(400).json({ message: error.message });
    }
});

// Initialize blockchain with genesis block
app.post(
    '/blockchain',
    (
        req: Request<
            any,
            any,
            {
                blockchain: IBlockchain;
                utxos: { [key: string]: ITransactionOutput[] };
                pendingTransactions: ITransaction[];
            }
        >,
        res: Response,
    ) => {
        node.initBlockchain(req.body.blockchain, req.body.utxos, req.body.pendingTransactions);
        res.status(200).json({ message: 'OK' });
    },
);

// Impose latest block to all nodes, after successful mining
app.post('/block', async (req: Request<any, any, { block: IBlock }>, res: Response) => {
    try {
        await node.postBlock(req.body.block);
        res.status(200).json({ message: 'OK' });
    } catch (e) {
        const error = e as Error;
        res.status(400).json({ message: error.message });
    }
});

// Get latest block's transactions
app.get('/transaction', (_, res: Response) => {
    try {
        const transactions = node.getLatestBlockTransactions();
        res.status(200).json({ transactions });
    } catch (e) {
        const error = e as Error;
        res.status(400).json({ message: error.message });
    }
});

// Create new transaction
app.post(
    '/transaction',
    async (req: Request<any, any, { recipientId: number; amount: number }>, res: Response) => {
        try {
            await node.postTransaction(req.body.recipientId, req.body.amount);
            res.status(200).json({ message: 'OK' });
        } catch (e) {
            const error = e as Error;
            logger.warn(error.message);
            res.status(400).json({ message: error.message });
        }
    },
);

// Broadcast new transaction
app.put(
    '/transaction',
    async (req: Request<any, any, { transaction: ITransaction }>, res: Response) => {
        try {
            await node.putTransaction(req.body.transaction);
            res.status(200).json({ message: 'OK' });
        } catch (e) {
            const error = e as Error;
            res.status(400).json({ message: error.message });
        }
    },
);

// Get wallet balance
app.get('/balance', (_, res: Response) => {
    res.status(200).json({ balance: node.getWalletBalance() });
});

app.listen(config.port, () => logger.info(`Started listening on ${config.url}:${config.port}`));
