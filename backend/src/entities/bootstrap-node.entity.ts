import INode from '../interfaces/node.interface';
import Node from './node.entity';
import config from '../config';
import logger from '../utilities/logger';
import hash from '../utilities/hash';
import Transaction from './transaction.entity';
import TransactionOutput from './transaction-output.entity';
import httpRequest from '../utilities/http';
import { BlockchainService, TransactionService } from '../services';
import Block from './block.entity';

export default class BootstrapNode extends Node {
    constructor() {
        super();
        this.ring = [
            { index: this.index, url: this.url, port: this.port, publicKey: this.publicKey },
        ];
        this.createGenesisBlock();
        logger.info('Genesis block created');
    }

    async insertNodeToRing(node: INode) {
        if (this.ring.length === config.numOfNodes) {
            logger.info(`Ring capacity maxed, can't insert new node`);
            return;
        }

        this.ring.push(node);
        this.ring.sort((u, v) => u.index - v.index);
        logger.info(`Node with URL ${node.url}:${node.port} added`);

        await this.broadcast('POST', 'ring', { ring: this.ring });

        await httpRequest({
            url: node.url,
            port: node.port,
            endpoint: 'blockchain',
            method: 'POST',
            body: {
                blockchain: BlockchainService.getChain(),
                currentBlock: BlockchainService.getCurrentBlock(),
                utxos: Object.fromEntries(TransactionService.getAllUtxos()),
                pendingTransactions: TransactionService.getPendingTransactionsArray(),
            },
        });

        await this.postTransaction(node.index, 100);
    }

    createGenesisBlock() {
        const genesisTransaction = new Transaction({
            amount: config.numOfNodes * 100,
            receiverAddress: this.publicKey,
            senderAddress: 'satone',
        });

        const genesisUtxo = new TransactionOutput(
            genesisTransaction.transactionId,
            genesisTransaction.receiverAddress,
            genesisTransaction.amount,
        );

        TransactionService.setTransactionOutputs(genesisTransaction, [genesisUtxo]);
        TransactionService.signTransaction(genesisTransaction, this.wallet.privateKey);

        const genesisBlock = new Block(0, '1');

        genesisBlock.currentHash = hash(
            BlockchainService.getValidatableBlockData(genesisBlock),
        );

        BlockchainService.setGenesisBlock(genesisBlock);
        TransactionService.setInitialUtxo(this.publicKey, genesisUtxo);
        TransactionService.enqueueTransaction(genesisTransaction);

        if (config.blockCapacity === 1) {
            this.initMining();
        }
    }
}