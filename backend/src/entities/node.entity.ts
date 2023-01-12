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
import IBlock from '../interfaces/block.interface';

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
								publicKey: this.publicKey
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

	async initBlockchain(blockchain: IBlockchain, utxos: { [key: string]: ITransactionOutput[] }) {
		try {
			this.blockchainService.setBlockchain(blockchain);

			const incomingUtxos = new Map<string, ITransactionOutput[]>(Object.entries(utxos));
			this.transactionService.setUtxos(incomingUtxos);
		} catch (error) {
			await this.resolveConflicts();
		}
	}

	getWalletBalance(): number {
		const utxos = this.transactionService.getUtxos(this.publicKey);
		if (!utxos) return 0;

		return utxos.reduce((total, utxo) => total + utxo.amount, 0);
	}

	async postTransaction(recipientId: number, amount: number) {
		if (recipientId > this.ring.length - 1) throw new Error('Recipient with given ID not found');
		if (recipientId === this.index) throw new Error('Recipient cannot be the same as the sender');

		const newTransaction = new Transaction({
			amount,
			senderAddress: this.publicKey,
			receiverAddress: this.ring[recipientId].publicKey
		});

		this.transactionService.signTransaction(newTransaction, this.wallet.privateKey);
		this.transactionService.validateTransaction(newTransaction);
		this.blockchainService.appendTransaction(newTransaction);

		const responses = await this.broadcast('PUT', 'transaction', { transaction: newTransaction });
		let errorResponse = responses.find((res) => res.status === 400);
		if (errorResponse) {
			throw new Error((await errorResponse.json()).message);
		}

		setTimeout(() => this.mineLatestBlock());
	}

	putTransaction(t: Transaction) {
		this.transactionService.validateTransaction(t);
		this.blockchainService.appendTransaction(t);

		// If block capacity is maxed out, start mining block
		setTimeout(() => this.mineLatestBlock());
	}

	getLatestBlockTransactions(): any[] {
		const latestBlock = this.blockchainService.getLatestBlock();
		const latestBlockTransactions = latestBlock.transactions.map((t) => {
			return {
				recipientId: this.ring.find((node) => node.publicKey === t.receiverAddress)?.index,
				...t
			};
		});
		return latestBlockTransactions;
	}

	getBlockchain() {
		const blockchain = this.blockchainService.getChain();
		const utxos = this.transactionService.getAllUtxos();

		return {
			blockchain,
			utxos: Object.fromEntries(utxos)
		};
	}

	async resolveConflicts() {
		// Fetch blockchain from all nodes and set the longest
		const responses = await this.broadcast('GET', 'blockchain');

		const chains = await Promise.all(
			responses.map(
				(res) =>
					res.json() as Promise<{
						blockchain: IBlockchain;
						utxos: { [key: string]: ITransactionOutput[] };
					}>
			)
		);

		let maxLength = chains[0].blockchain.blocks.length;
		let longestChain: IBlockchain = chains[0].blockchain;
		let longestChainUtxos = chains[0].utxos;

		for (const chain of chains) {
			if (chain.blockchain.blocks.length > maxLength) {
				logger.info(`length ${chain.blockchain.blocks.length}`);
				maxLength = chain.blockchain.blocks.length;
				longestChain = chain.blockchain;
				longestChainUtxos = chain.utxos;
			}
		}

		this.initBlockchain(longestChain, longestChainUtxos);
	}

	async postBlock(block: IBlock) {
		try {
			this.minerService.abortMining();
			this.blockchainService.insertBlock(block);

			logger.info(`Block ${block.index} inserted`);
		} catch (error) {
			logger.error(error);
			await this.resolveConflicts();
		}
	}

	async mineLatestBlock() {
		try {
			const latestBlock = this.blockchainService.getLatestBlock();

			if (latestBlock.transactions.length !== config.blockCapacity) {
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
	}
}
