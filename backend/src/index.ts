import config from './config';
import Node from './entities/node.entity';
import logger from './utilities/logger';
import express, { Request, Response } from 'express';
import BootstrapNode from './entities/bootstrap-node.entity';
import NoobcashException from './utilities/noobcash-exception';
import cors from 'cors';
import {
    BalanceDto,
    BlockchainDto,
    BlockDto,
    LatestBlockTransactionsDto,
    MessageResponseDto,
    NodeDto,
    RingDto,
    TransactionDto,
} from './interfaces/api.dto';

const app = express();
const node: Node = config.isBootstrap ? new BootstrapNode() : new Node();

app.use(cors());
app.use(express.json());

// REST endpoints

// Connect node to ring (only bootstrap node exposes this endpoint)
if (node instanceof BootstrapNode) {
    app.post(
        '/node',
        async (req: Request<any, any, NodeDto>, res: Response<MessageResponseDto>) => {
            try {
                await node.insertNodeToRing(req.body.node);
                res.status(200).json({ message: 'OK' });
            } catch (e) {
                const error = e as NoobcashException;
                res.status(error.code).json({ message: error.message });
            }
        },
    );
}

// Get node group information
app.get('/ring', (_: any, res: Response<RingDto>) => {
    res.status(200).json({ ring: node.ring });
});

// Update info of all nodes
app.post('/ring', (req: Request<any, any, RingDto>, res: Response<MessageResponseDto>) => {
    try {
        node.setRing(req.body.ring);
        logger.info(`Node ${node.ring[node.ring.length - 1].index} connected to ring!`);
        res.status(200).json({ message: 'OK' });
    } catch (e) {
        const error = e as NoobcashException;
        logger.error(error.message);
        res.status(error.code).json({ message: error.message });
    }
});

// Get Blockchain and UTXO's
app.get('/blockchain', (_, res: Response<BlockchainDto | MessageResponseDto>) => {
    try {
        const { blockchain, currentBlock, utxos, pendingTransactions } = node.getBlockchain();

        res.status(200).json({ blockchain, currentBlock, utxos, pendingTransactions });
    } catch (e) {
        const error = e as NoobcashException;
        res.status(error.code).json({ message: error.message });
    }
});

// Set the node state
app.post(
    '/blockchain',
    (req: Request<any, any, BlockchainDto>, res: Response<MessageResponseDto>) => {
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
app.post('/block', async (req: Request<any, any, BlockDto>, res: Response<MessageResponseDto>) => {
    try {
        await node.postBlock(req.body.block, req.body.stateChecksum);
        res.status(200).json({ message: 'OK' });
    } catch (e) {
        const error = e as NoobcashException;
        res.status(error.code).json({ message: error.message });
    }
});

// Get latest block's transactions
app.get('/transaction', (_, res: Response<LatestBlockTransactionsDto | MessageResponseDto>) => {
    try {
        const transactions = node.getLatestBlockTransactions();
        res.status(200).json(transactions);
    } catch (e) {
        const error = e as NoobcashException;
        res.status(error.code).json({ message: error.message });
    }
});

// Create new transaction
app.post(
    '/transaction',
    async (
        req: Request<any, any, { recipientId: number; amount: number }>,
        res: Response<MessageResponseDto>,
    ) => {
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
app.put('/transaction', async (req: Request<any, any, TransactionDto>, res: Response) => {
    try {
        await node.putTransaction(req.body.transaction);
        res.status(200).json({ message: 'OK' });
    } catch (e) {
        const error = e as NoobcashException;
        res.status(error.code).json({ message: error.message });
    }
});

// Get wallet balance
app.get('/balance', (_, res: Response<BalanceDto>) => {
    res.status(200).json({ balance: node.getWalletBalance() });
});

// Get all node balances
app.get('/balances', (_, res) => {
    res.status(200).json({ balances: node.getAllWalletBalances() });
});

app.listen(config.port, () => logger.info(`Started listening on ${config.url}:${config.port}`));
