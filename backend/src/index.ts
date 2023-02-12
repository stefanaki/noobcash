import config from './config';
import Node from './entities/node.entity';
import logger from './utilities/logger';
import express, { Request, Response } from 'express';
import BootstrapNode from './entities/bootstrap-node.entity';
import IBlock from './interfaces/block.interface';
import NoobcashException from './utilities/noobcash-exception';
import cors from 'cors';
import { BalanceDto, BlockchainDto, NodeDto, RingDto, TransactionDto } from './interfaces/api.dto';

const app = express();
const node: Node = config.isBootstrap ? new BootstrapNode() : new Node();

app.use(cors());
app.use(express.json());

// REST endpoints

// Connect node to ring (only bootstrap node exposes this endpoint)
if (node instanceof BootstrapNode) {
    app.post('/node', async (req: Request<any, any, NodeDto>, res: Response) => {
        try {
            await node.insertNodeToRing(req.body.node);
            res.status(200).json({ nodeId: node.ring.length - 1 });
        } catch (e) {
            const error = e as NoobcashException;
            res.status(error.code).json({ message: error.message });
        }
    });
}

// Get node group information
app.get('/ring', (_: any, res: Response<RingDto>) => {
    res.status(200).json({ ring: node.ring });
});

// Update info of all nodes
app.post('/ring', (req: Request<any, any, RingDto>, res: Response) => {
    try {
        node.setRing(req.body.ring);
        logger.info(`Node ${node.ring[node.ring.length - 1].index} connected to ring!`);
        res.status(200).send('OK');
    } catch (e) {
        const error = e as NoobcashException;
        logger.error(error.message);
        res.status(error.code).json({ message: error.message });
    }
});

// Get Blockchain and UTXO's
app.get('/blockchain', (_, res: Response) => {
    try {
        const { blockchain, currentBlock, utxos, pendingTransactions } = node.getBlockchain();

        res.status(200).json({ blockchain, currentBlock, utxos, pendingTransactions });
    } catch (e) {
        const error = e as NoobcashException;
        res.status(error.code).json({ message: error.message });
    }
});

// Get Blockchain and UTXO's
app.get('/blockchain_test', (_, res: Response) => {
    try {
        const { blockchain } = node.getBlockchain();

        const bl = blockchain.blocks.map(block => {
            return {
                block_idx: block.index,
                transactions: block.transactions.map(t => {
                    return {
                        sender: node.ring.find(node => node.publicKey === t.senderAddress)?.index,
                        recv: node.ring.find(node => node.publicKey === t.receiverAddress)?.index,
                        amount: t.amount,
                        timestamp: t.timestamp,
                    };
                }),
            };
        });

        res.status(200).json({ bl });
    } catch (e) {
        const error = e as Error;
        res.status(400).json({ message: error.message });
    }
});

// Set the node state
app.post(
    '/blockchain',
    (
        req: Request<
            any,
            any,
            BlockchainDto
        >,
        res: Response,
    ) => {
        try {
            const { blockchain, currentBlock, utxos, pendingTransactions } = req.body;

            node.setState(blockchain, currentBlock, utxos, pendingTransactions);
            res.status(200).json({ message: 'OK' });
        } catch (e) {
            const error = e as NoobcashException;
            res.status(error.code).json({ message: error.message });
        }
    },
);

// Impose latest block to all nodes, after successful mining
app.post('/block', async (req: Request<any, any, { block: IBlock, stateChecksum: string }>, res: Response) => {
    try {
        await node.postBlock(req.body.block, req.body.stateChecksum);
        res.status(200).json({ message: 'OK' });
    } catch (e) {
        const error = e as NoobcashException;
        res.status(error.code).json({ message: error.message });
    }
});

// Get latest block's transactions
app.get('/transaction', (_, res: Response) => {
    try {
        const transactions = node.getLatestBlockTransactions();
        res.status(200).json({ transactions });
    } catch (e) {
        const error = e as NoobcashException;
        res.status(error.code).json({ message: error.message });
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
            const error = e as NoobcashException;
            logger.warn(error.message);
            res.status(error.code).json({ message: error.message });
        }
    },
);

// Broadcast new transaction
app.put(
    '/transaction',
    async (req: Request<any, any, TransactionDto>, res: Response) => {
        try {
            await node.putTransaction(req.body.transaction);
            res.status(200).json({ message: 'OK' });
        } catch (e) {
            const error = e as NoobcashException;
            res.status(error.code).json({ message: error.message });
        }
    },
);

// Get wallet balance
app.get('/balance', (_, res: Response<BalanceDto>) => {
    res.status(200).json({ balance: node.getWalletBalance() });
});

app.get('/balance_test', (req, res) => {
    let balances: number[] = [];

    node.ring.forEach(n => {
        const u = node.transactionService.getUtxos(n.publicKey);
        if (!u) {
            balances.push(0);
        } else {
            balances.push(u.reduce((acc, curr) => acc + curr.amount, 0));
        }
    });

    res.status(200).json({balances});
});

app.get('/queue', (req, res) => 
    res.status(200).json({queue: node.transactionService.getPendingTransactionsArray().map(t => t.transactionId)})
)

app.listen(config.port, () => logger.info(`Started listening on ${config.url}:${config.port}`));