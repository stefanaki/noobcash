import INode from '../interfaces/node.interface';
import Node from './node.entity';
import config from '../config';
import logger from '../utilities/logger';
import IBlock from '../interfaces/block.interface';
import hash from '../utilities/hash';
import Transaction from './transaction.entity';
import TransactionOutput from './transaction-output.entity';

export default class BootstrapNode extends Node {
	constructor() {
		super();
		this.setRing([{ url: this.url, port: this.port, publicKey: this.wallet.publicKey }]);
		this.createGenesisBlock().then(() => logger.info('Genesis block created'));
	}

	async insertNodeToRing(node: INode) {
		if (this.ring.length === config.numOfNodes) {
			logger.info(`Ring capacity maxed, can't insert new node`);
			return;
		}

		this.ring.push(node);
		logger.info(`Node with URL ${node.url}:${node.port} added`);
		await this.broadcast('POST', 'ring', { ring: this.ring });
	}

	async createGenesisBlock() {
		const genesisTransaction = new Transaction({
			amount: config.numOfNodes * 100,
			receiverAddress: this.publicKey,
			senderAddress: 'satone'
		});

		const genesisUtxo = new TransactionOutput(
			genesisTransaction.transactionId,
			genesisTransaction.receiverAddress,
			genesisTransaction.amount
		);

		this.transactionService.setTransactionOutputs(genesisTransaction, [genesisUtxo]);
		this.transactionService.signTransaction(genesisTransaction, this.wallet.privateKey);

		const genesisBlockData = {
			index: 0,
			timestamp: new Date(),
			transactions: [genesisTransaction],
			nonce: 0,
			previousHash: '1'
		};

		const genesisBlock: IBlock = {
			...genesisBlockData,
			currentHash: hash(genesisBlockData)
		};

		this.blockchainService.setGenesisBlock(genesisBlock);
	}
}
