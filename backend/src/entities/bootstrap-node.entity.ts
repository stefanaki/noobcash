import INode from '../interfaces/node.interface';
import Node from './node.entity';
import config from '../config';
import logger from '../utilities/logger';
import IBlock from '../interfaces/block.interface';
import hash from '../utilities/hash';
import Transaction from './transaction.entity';
import TransactionOutput from './transaction-output.entity';
import httpRequest from '../utilities/http';

export default class BootstrapNode extends Node {
	constructor() {
		super();
		this.ring = [
			{ index: this.index, url: this.url, port: this.port, publicKey: this.wallet.publicKey }
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
				blockchain: this.blockchainService.getChain(),
				utxos: Object.fromEntries(this.transactionService.getAllUtxos())
			}
		});

		await this.postTransaction(node.index, 100);
	}

	createGenesisBlock() {
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
		this.transactionService.setInitialUtxo(this.publicKey, genesisUtxo);
	}
}
