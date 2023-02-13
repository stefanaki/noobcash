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
import { BlockchainDto, LatestBlockTransactionsDto } from '../interfaces/api.dto';

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

        // Wait at least NODE_INDEX seconds before contacting bootstrap node
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
                config.node * 1500,
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

    setState(
        blockchain: IBlockchain,
        currentBlock: IBlock,
        utxos: { [key: string]: ITransactionOutput[] },
        pendingTransactions: ITransaction[],
    ) {
        try {
            this.blockchainService.setBlockchain(blockchain);
            this.blockchainService.setCurrentBlock(currentBlock);
            this.transactionService.setPendingTransactions(pendingTransactions);

            const utxosMap = new Map<string, ITransactionOutput[]>(Object.entries(utxos));
            this.transactionService.setUtxos(utxosMap);

            if (this.transactionService.pendingTransactions.length >= config.blockCapacity) {
                this.initMining();
            }
        } catch (e) {
            const error = e as NoobcashException;
            logger.error(error.message);
            this.resolveConflicts();
        }
    }

    getWalletBalance(): number {
        const utxos = this.transactionService.getUtxos(this.publicKey);
        if (!utxos) return 0;

        return utxos.reduce((total, utxo) => total + utxo.amount, 0);
    }

    async postTransaction(recipientId: number, amount: number) {
        if (recipientId < 0 || recipientId > this.ring.length - 1)
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

        this.transactionService.enqueueTransaction(newTransaction);
        await this.broadcast('PUT', 'transaction', {
            transaction: newTransaction,
        });

        if (this.transactionService.pendingTransactions.length >= config.blockCapacity) {
            this.initMining();
        }
    }

    async putTransaction(t: Transaction) {
        this.transactionService.enqueueTransaction(t);

        if (this.transactionService.pendingTransactions.length >= config.blockCapacity) {
            this.initMining();
        }
    }

    getLatestBlockTransactions(): LatestBlockTransactionsDto[] {
        const latestBlock = this.blockchainService.getLatestMinedBlock();

        return latestBlock.transactions
            .filter(t => t.senderAddress === this.publicKey || t.receiverAddress === this.publicKey)
            .map(t => {
                const recipientId = this.ring.find(node => node.publicKey === t.receiverAddress)?.index ?? -1;
                const senderId = this.ring.find(node => node.publicKey === t.senderAddress)?.index ?? -1;

                return {
                    recipientId,
                    senderId,
                    transactionType: t.receiverAddress === this.publicKey ? 'CREDIT' : 'DEBIT',
                    timestamp: new Date(t.timestamp).toISOString(),
                    transactionId: t.transactionId,
                    senderAddress: t.senderAddress,
                    receiverAddress: t.receiverAddress,
                    amount: t.amount,
                };
            });
    }

    getBlockchain() {
        const blockchain = this.blockchainService.getChain();
        const utxos = this.transactionService.getAllUtxos();
        const pendingTransactions = this.transactionService.getPendingTransactionsArray();
        const currentBlock = this.blockchainService.getCurrentBlock();

        return {
            blockchain,
            currentBlock,
            utxos: Object.fromEntries(utxos),
            pendingTransactions,
        };
    }

    async resolveConflicts() {
        this.minerService.abortMining();

        // Fetch blockchain from all nodes and set the longest
        const responses = await this.broadcast('GET', 'blockchain');

        const chains = await Promise.all(
            responses.map(res => res.json() as Promise<BlockchainDto>),
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

        this.setState(
            chains[longestChainIndex].blockchain,
            chains[longestChainIndex].currentBlock,
            chains[longestChainIndex].utxos,
            chains[longestChainIndex].pendingTransactions,
        );
        logger.info('Conflicts resolved');

        if (this.transactionService.pendingTransactions.length >= config.blockCapacity) {
            this.initMining();
        }
    }

    async postBlock(block: IBlock, stateChecksum: string) {
        try {
            this.minerService.abortMining();
            this.blockchainService.validateStateChecksum(stateChecksum);
            this.blockchainService.insertBlock(block);

            logger.info(`Block ${block.index} inserted`);
        } catch (e) {
            const error = e as NoobcashException;
            logger.error(error.message);
            this.resolveConflicts();
        }
    }

    async initMining() {
        try {
            if (this.minerService.isNodeMining() || this.ring.length < config.numOfNodes) return;

            while (this.transactionService.pendingTransactions.length >= config.blockCapacity) {
                const currentBlock = this.blockchainService.getCurrentBlock();

                let pendingTransactions = this.transactionService.dequeuePendingTransactions(
                    config.blockCapacity,
                );

                for (const transaction of pendingTransactions) {
                    this.blockchainService.appendTransactionToCurrentBlock(transaction);
                }

                this.blockchainService.updateCurrentBlockHash();

                if (await this.minerService.mineBlock(currentBlock)) {
                    const stateChecksum = this.blockchainService.getNodeStateChecksum();
                    await this.broadcast('POST', 'block', { block: currentBlock, stateChecksum });
                    this.blockchainService.insertBlock(currentBlock);
                    logger.info(`Block ${currentBlock.index} inserted`);
                }

                if (this.transactionService.pendingTransactionsExist())
                    logger.info(
                        `Queue: Pending ${this.transactionService.pendingTransactions.length}`,
                    );
            }
        } catch {
            this.resolveConflicts();
        }
    }
}
