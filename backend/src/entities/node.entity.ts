import config from '../config';
import INode from '../interfaces/node.interface';
import Wallet from './wallet.entity';
import logger from '../utilities/logger';
import TransactionService from '../services/transaction.service';
import MinerService from '../services/miner.service';
import BlockchainService from '../services/blockchain.service';
import Transaction from './transaction.entity';
import IBlockchain from '../interfaces/blockchain.interface';
import { ITransactionOutput } from '../interfaces/transaction.interface';
import httpRequest, { HttpRequestEndpoint, HttpRequestMethod } from '../utilities/http';

export default class Node implements INode {
	wallet: Wallet;
	index: number;
	url: string;
	port: string;
	publicKey: string;
	ring: INode[];
	transactionService: TransactionService;
	minerService: MinerService;
	blockchainService: BlockchainService;

	constructor() {
		this.index = config.node;
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
								publicKey: this.wallet.publicKey
							}
						}
					}),
				config.node * 500
			);
		}
	}

	setRing(ring: INode[]) {
		this.ring = ring;
	}

	protected async broadcast(method: HttpRequestMethod, endpoint: HttpRequestEndpoint, body?: any) {
		logger.info(`Broadcast ${method} /${endpoint}`);

		const responses = await Promise.all(
			this.ring
				.filter((node) => node.index !== this.index)
				.map((node) => httpRequest({ method, endpoint, url: node.url, port: node.port, body }))
		);

		return responses;
	}

	initializeBlockchain(blockchain: IBlockchain, utxos: { [key: string]: ITransactionOutput[] }) {
		this.blockchainService.setBlockchain(blockchain);

		const incomingUtxos = new Map<string, ITransactionOutput[]>(Object.entries(utxos));
		this.transactionService.setUtxos(incomingUtxos);
	}

	getWalletBalance(): number {
		const utxos = this.transactionService.getUtxos(this.publicKey);
		if (!utxos) return 0;

		return utxos.reduce((total, utxo) => total + utxo.amount, 0);
	}

	async createTransaction(recipientId: number, amount: number) {
		if (recipientId > this.ring.length - 1) throw new Error('Recipient with given ID not found');

		const newTransaction = new Transaction({
			amount,
			senderAddress: this.publicKey,
			receiverAddress: this.ring[recipientId].publicKey
		});

		this.transactionService.signTransaction(newTransaction, this.wallet.privateKey);
		this.transactionService.validateTransaction(newTransaction);
		const responses = await this.broadcast('PUT', 'transaction', { transaction: newTransaction });

		let errorResponse = responses.find((res) => res.status === 400);
		if (errorResponse) {
			throw new Error((await errorResponse.json()).message);
		}
	}

	insertTransaction(t: Transaction) {
		this.transactionService.validateTransaction(t);
		this.blockchainService.appendTransaction(t);

		// TODO: If block capacity is maxed out, start mining block
		const latestBlock = this.blockchainService.getLatestBlock();
		if (latestBlock.transactions.length === config.blockCapacity) {
			setTimeout(() => this.minerService.mineBlock(latestBlock));
		}
	}
}
