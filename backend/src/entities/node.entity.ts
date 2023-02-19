import config from '../config';
import INode from '../interfaces/node.interface';
import Wallet from './wallet.entity';
import logger from '../utilities/logger';
import { BlockchainService, TransactionService, MinerService } from '../services';
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

    constructor() {
        this.index = config.node;
        this.url = config.url;
        this.port = config.port;
        this.wallet = new Wallet();
        this.publicKey = this.wallet.publicKey;
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
            BlockchainService.setBlockchain(blockchain);
            BlockchainService.setCurrentBlock(currentBlock);
            TransactionService.setPendingTransactions(pendingTransactions);

            const utxosMap = new Map<string, ITransactionOutput[]>(Object.entries(utxos));
            TransactionService.setUtxos(utxosMap);

            if (TransactionService.pendingTransactions.length >= config.blockCapacity) {
                this.initMining();
            }
        } catch (e) {
            const error = e as NoobcashException;
            logger.error(error.message);
            this.resolveConflicts();
        }
    }

    getWalletBalance(): number {
        const utxos = TransactionService.getUtxos(this.publicKey);
        if (!utxos) return 0;

        return utxos.reduce((total, utxo) => total + utxo.amount, 0);
    }

    getAllWalletBalances(): number[] {
        const balances: number[] = [];

        this.ring.forEach(node => {
            const nodeUtxos = TransactionService.getUtxos(node.publicKey);

            if (!nodeUtxos) {
                balances.push(0);
            } else {
                balances.push(nodeUtxos.reduce((acc, curr) => acc + curr.amount, 0));
            }
        });

        return balances;
    }

    async postTransaction(recipientId: number, amount: number) {
        if (recipientId === this.index)
            throw new NoobcashException('Recipient cannot be the same as the sender', 400);

        let receiver: INode | undefined;

        if (this.ring.length < config.numOfNodes) {
            receiver = this.ring.find(node => node.index === recipientId);
        } else {
            receiver = this.ring[recipientId];
        }

        if (!receiver)
            throw new NoobcashException(`Recipient with ID ${recipientId} not found`, 400);

        const newTransaction = new Transaction({
            amount,
            senderAddress: this.publicKey,
            receiverAddress: receiver.publicKey,
            timestamp: Date.now(),
        });

        TransactionService.signTransaction(newTransaction, this.wallet.privateKey);

        this.broadcast('PUT', 'transaction', {
            transaction: newTransaction,
        });
        TransactionService.enqueueTransaction(newTransaction);

        if (TransactionService.pendingTransactions.length >= config.blockCapacity) {
            this.initMining();
        }
    }

    async putTransaction(t: Transaction) {
        TransactionService.enqueueTransaction(t);

        if (TransactionService.pendingTransactions.length >= config.blockCapacity) {
            this.initMining();
        }
    }

    getLatestBlockTransactions(): LatestBlockTransactionsDto {
        const latestBlock = BlockchainService.getLatestMinedBlock();

        const transactions = latestBlock.transactions
            // .filter(t => t.senderAddress === this.publicKey || t.receiverAddress === this.publicKey)
            .map(t => {
                const recipientId =
                    this.ring.find(node => node.publicKey === t.receiverAddress)?.index ?? -1;
                const senderId =
                    this.ring.find(node => node.publicKey === t.senderAddress)?.index ?? -1;

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

        return { transactions: transactions };
    }

    getBlockchain() {
        const blockchain = BlockchainService.getChain();
        const utxos = TransactionService.getAllUtxos();
        const pendingTransactions = TransactionService.getPendingTransactionsArray();
        const currentBlock = BlockchainService.getCurrentBlock();

        return {
            blockchain,
            currentBlock,
            utxos: Object.fromEntries(utxos),
            pendingTransactions,
        };
    }

    async resolveConflicts() {
        MinerService.abortMining();

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

        if (TransactionService.pendingTransactions.length >= config.blockCapacity) {
            this.initMining();
        }
    }

    async postBlock(block: IBlock, stateChecksum: string) {
        try {
            MinerService.abortMining();
            BlockchainService.validateStateChecksum(stateChecksum);
            BlockchainService.insertBlock(block);

            logger.info(`Block ${block.index} inserted`);
        } catch (e) {
            const error = e as NoobcashException;
            logger.error(error.message);
            this.resolveConflicts();
        }
    }

    async initMining() {
        try {
            if (MinerService.isNodeMining() || this.ring.length < config.numOfNodes) return;

            while (TransactionService.pendingTransactions.length >= config.blockCapacity) {
                const currentBlock = BlockchainService.getCurrentBlock();

                let pendingTransactions = TransactionService.dequeuePendingTransactions(
                    config.blockCapacity,
                );

                for (const transaction of pendingTransactions) {
                    BlockchainService.appendTransactionToCurrentBlock(transaction);
                }

                BlockchainService.updateCurrentBlockHash();

                if (await MinerService.mineBlock(currentBlock)) {
                    const stateChecksum = BlockchainService.getNodeStateChecksum();
                    await this.broadcast('POST', 'block', { block: currentBlock, stateChecksum });
                    BlockchainService.insertBlock(currentBlock);
                    logger.info(`Block ${currentBlock.index} inserted`);
                }

                if (TransactionService.pendingTransactionsExist())
                    logger.info(`Queue: Pending ${TransactionService.pendingTransactions.length}`);
            }
        } catch {
            this.resolveConflicts();
        }
    }
}
