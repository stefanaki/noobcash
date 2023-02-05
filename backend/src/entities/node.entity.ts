import config from '../config';
import INode from '../interfaces/node.interface';
import Wallet from './wallet.entity';
import logger from '../utilities/logger';
import TransactionService from '../services/transaction.service';
import MinerService from '../services/miner.service';
import BlockchainService from '../services/blockchain.service';
import Transaction from './transaction.entity';
import IBlockchain from '../interfaces/blockchain.interface';
import ITransaction, { ITransactionOutput } from '../interfaces/transaction.interface';
import httpRequest, { HttpRequestEndpoint, HttpRequestMethod } from '../utilities/http';
import IBlock from '../interfaces/block.interface';
import NoobcashException from '../utilities/noobcash-exception';

export default class Node implements INode {
    wallet: Wallet;
    index: number;
    url: string;
    port: string;
    publicKey: string;
    ring: INode[];
    transactionService: typeof TransactionService;
    minerService: typeof MinerService;
    blockchainService: typeof BlockchainService;

    constructor() {
        this.index = config.node;
        this.url = config.url;
        this.port = config.port;
        this.wallet = new Wallet();
        this.publicKey = this.wallet.publicKey;
        this.transactionService = TransactionService;
        this.minerService = MinerService;
        this.blockchainService = BlockchainService;
        logger.info('Noobcash node initialized');

        // Wait NODE_INDEX seconds before contacting bootstrap node
        if (!config.isBootstrap) {
            setTimeout(
                async () =>
                    await httpRequest({
                        url: config.bootstrapUrl,
                        port: config.bootstrapPort,
                        endpoint: 'node',
                        method: 'POST',
                        body: {
                            node: {
                                index: this.index,
                                url: this.url,
                                port: this.port,
                                publicKey: this.publicKey,
                            },
                        },
                    }),
                config.node * 1000,
            );
        }
    }

    setRing(ring: INode[]) {
        this.ring = ring;
    }

    async broadcast(method: HttpRequestMethod, endpoint: HttpRequestEndpoint, body?: any) {
        logger.info(`Broadcast ${method} /${endpoint}`);

        const responses = await Promise.all(
            this.ring
                .filter(node => node.index !== this.index)
                .map(node =>
                    httpRequest({ method, endpoint, url: node.url, port: node.port, body }),
                ),
        );

        const errorResponse = responses.find(res => res.status !== 200);
        if (errorResponse) {
            const parsedErrorResponse = (await errorResponse.json()) as { message: string };
            throw new NoobcashException(parsedErrorResponse.message, errorResponse.status);
        }

        return responses;
    }

    initBlockchain(
        blockchain: IBlockchain,
        utxos: { [key: string]: ITransactionOutput[] },
        pendingTransactions: ITransaction[],
    ) {
        try {
            this.blockchainService.setBlockchain(blockchain);
            this.transactionService.setPendingTransactions(pendingTransactions);

            const incomingUtxos = new Map<string, ITransactionOutput[]>(Object.entries(utxos));
            this.transactionService.setUtxos(incomingUtxos);
        } catch (e) {
            const error = e as NoobcashException;
            logger.error(error.message);
            this.resolveConflicts();
        } finally {
            this.initMining();
        }
    }

    getWalletBalance(): number {
        const utxos = this.transactionService.getUtxos(this.publicKey);
        if (!utxos) return 0;

        return utxos.reduce((total, utxo) => total + utxo.amount, 0);
    }

    async postTransaction(recipientId: number, amount: number) {
        if (recipientId > this.ring.length - 1)
            throw new NoobcashException('Recipient with given ID not found', 404);
        if (recipientId === this.index)
            throw new NoobcashException('Recipient cannot be the same as the sender', 400);

        const newTransaction = new Transaction({
            amount,
            senderAddress: this.publicKey,
            receiverAddress: this.ring[recipientId].publicKey,
            timestamp: Date.now(),
        });

        this.transactionService.signTransaction(newTransaction, this.wallet.privateKey);
        this.transactionService.validateTransaction(newTransaction);

        const latestBlock = this.blockchainService.getLatestBlock();
        if (
            !this.minerService.isNodeMining() &&
            latestBlock.transactions.length < config.blockCapacity
        ) {
            this.blockchainService.appendTransactionToLatestBlock(newTransaction);
        } else {
            this.transactionService.enqueueTransaction(newTransaction);
        }

        await this.broadcast('PUT', 'transaction', {
            transaction: newTransaction,
        });

        // Initiate mining routine if needed
        if (
            !this.minerService.isNodeMining() &&
            latestBlock.transactions.length === config.blockCapacity
        ) {
            this.initMining();
        }
    }

    async putTransaction(t: Transaction) {
        const latestBlock = this.blockchainService.getLatestBlock();
        this.transactionService.validateTransaction(t);

        if (
            !this.minerService.isNodeMining() &&
            latestBlock.transactions.length < config.blockCapacity
        ) {
            this.blockchainService.appendTransactionToLatestBlock(t);
        } else {
            this.transactionService.enqueueTransaction(t);
        }

        // Initiate mining routine if needed
        if (
            !this.minerService.isNodeMining() &&
            latestBlock.transactions.length === config.blockCapacity
        ) {
            this.initMining();
        }
    }

    getLatestBlockTransactions() {
        const latestBlock = this.blockchainService.getLatestBlock();

        return latestBlock.transactions
            .filter(t => t.senderAddress === this.publicKey || t.receiverAddress === this.publicKey)
            .map(t => {
                return {
                    recipientId:
                        this.ring.find(node => node.publicKey === t.receiverAddress)?.index ?? -1,
                    transactionType: t.receiverAddress === this.publicKey ? 'CREDIT' : 'DEBIT',
                    ...t,
                    timestamp: new Date(t.timestamp).toISOString(),
                };
            });
    }

    getBlockchain() {
        const blockchain = this.blockchainService.getChain();
        const utxos = this.transactionService.getAllUtxos();
        const pendingTransactions = this.transactionService.getPendingTransactions();

        return {
            blockchain,
            utxos: Object.fromEntries(utxos),
            pendingTransactions,
        };
    }

    async resolveConflicts() {
        // Fetch blockchain from all nodes and set the longest
        const responses = await this.broadcast('GET', 'blockchain');

        const chains = await Promise.all(
            responses.map(
                res =>
                    res.json() as Promise<{
                        blockchain: IBlockchain;
                        utxos: { [key: string]: ITransactionOutput[] };
                        pendingTransactions: ITransaction[];
                    }>,
            ),
        );

        let longestChainIndex = 0;
        for (let i = 1; i < chains.length; i++) {
            if (
                chains[i].blockchain.blocks.length >
                chains[longestChainIndex].blockchain.blocks.length
            ) {
                longestChainIndex = i;
            }
        }

        this.initBlockchain(
            chains[longestChainIndex].blockchain,
            chains[longestChainIndex].utxos,
            chains[longestChainIndex].pendingTransactions,
        );
        logger.info('Conflicts resolved');
    }

    async postBlock(block: IBlock) {
        try {
            this.minerService.abortMining();
            this.blockchainService.insertBlock(block);

            logger.info(`Block ${block.index} inserted`);
        } catch (e) {
            const error = e as NoobcashException;
            logger.error(error.message);
            await this.resolveConflicts();
        }
    }

    async initMining() {
        let latestBlock = this.blockchainService.getLatestBlock();

        try {
            if (
                this.minerService.isNodeMining() ||
                latestBlock.transactions.length !== config.blockCapacity
            ) {
                return;
            }

            if (await this.minerService.mineBlock(latestBlock)) {
                await this.broadcast('POST', 'block', { block: latestBlock });

                this.blockchainService.insertBlock(latestBlock);
                logger.info(`Block ${latestBlock.index} inserted`);
            }
        } catch (error) {
            logger.warn(error);
        }

        if (this.transactionService.pendingTransactionsExist()) {
            logger.info(
                `There are ${this.transactionService.pendingTransactions.length} pending transactions after mining finished`,
            );
            let pendingTransactions = this.transactionService.dequeuePendingTransactions(
                config.blockCapacity,
            );

            for (const transaction of pendingTransactions) {
                this.blockchainService.appendTransactionToLatestBlock(transaction);
            }

            await this.initMining();
        }
    }
}
