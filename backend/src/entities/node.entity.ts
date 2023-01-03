import config from '../config';
import INode from '../interfaces/node.interface';
import Wallet from './wallet.entity';
import logger from '../utilities/logger';
import fetch from 'node-fetch';
import TransactionService from '../services/transaction.service';
import MinerService from '../services/miner.service';
import BlockchainService from '../services/blockchain.service';
import IBlock from '../interfaces/block.interface';
import Transaction from './transaction.entity';

type HttpRequestMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
type HttpRequestEndpoint =
	| 'healthcheck'
	| 'ring'
	| 'node'
	| 'blockchain'
	| 'transaction'
	| 'balance';

export default class Node implements INode {
	wallet: Wallet;
	url: string;
	port: string;
	publicKey: string;
	ring: INode[];
	transactionService: TransactionService;
	minerService: MinerService;
	blockchainService: BlockchainService;

	constructor() {
		this.url = config.url;
		this.port = config.port;
		this.wallet = new Wallet();
		this.publicKey = this.wallet.publicKey;
		this.transactionService = TransactionService.getInstance();
		this.minerService = MinerService.getInstance();
		this.blockchainService = BlockchainService.getInstance();
		logger.info('Noobcash node initialized');

		// Messy way to connect node to ring; wait NODE_INDEX number of
		// seconds and execute POST /node request
		// Only for testing!
		if (!config.isBootstrap) {
			setTimeout(
				async () =>
					await fetch(`${config.bootstrapUrl}:${config.bootstrapPort}/node`, {
						method: 'POST',
						body: JSON.stringify({
							node: {
								url: this.url,
								port: this.port,
								publicKey: this.wallet.publicKey
							}
						}),
						headers: {
							'Content-Type': 'application/json'
						}
					}),
				config.node * 1000
			);
		}
	}

	setRing(ring: INode[]) {
		this.ring = ring;
	}

	protected async broadcast(method: HttpRequestMethod, endpoint: HttpRequestEndpoint, body?: any) {
		logger.info(`Broadcast ${method} /${endpoint}`);
		try {
			await Promise.all(
				this.ring.map((node) => {
					if (node.url === this.url) return;
					return fetch(`${node.url}:${node.port}/${endpoint}`, {
						method,
						body: JSON.stringify(body),
						headers: {
							'Content-Type': 'application/json'
						}
					});
				})
			);
		} catch (error) {
			logger.error(error);
		}
	}

	initializeBlockchain(genesisBlock: IBlock) {
		this.blockchainService.setGenesisBlock(genesisBlock);
	}

	getWalletBalance(): number {
		const utxos = this.transactionService.getUtxos(this.publicKey);
		if (!utxos) return 0;

		return utxos.utxos.reduce((total, utxo) => total + utxo.amount, 0);
	}

	createTransaction(receiverAddress: string, amount: number) {
		if (!this.ring.find((node) => node.publicKey === receiverAddress))
			throw new Error('Recipient with given address not found');

		const newTransaction = new Transaction({
			amount,
			senderAddress: this.publicKey,
			receiverAddress: receiverAddress
		});

		this.transactionService.signTransaction(newTransaction, this.wallet.privateKey);
		this.broadcast('POST', 'transaction', { transaction: newTransaction });
	}

	insertTransaction(t: Transaction) {
		this.transactionService.validateTransaction(t);
		// TODO: If block capacity is maxed out, start mining block
	}
}
