import config from '../config';
import INode from '../interfaces/node.interface';
import Wallet from './wallet.entity';
import logger from '../utilities/logger';
import fetch from 'node-fetch';
import TransactionService from '../services/transaction.service';
import MinerService from '../services/miner.service';
import BlockchainService from '../services/blockchain.service';

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
	nodeInfo: INode[] = [
		{
			url: 'http://192.168.0.18',
			port: '3008',
			publicKey: "abc"
		},
		{
			url: 'http://192.168.0.19',
			port: '3009',
			publicKey: "abc"
		},
		{
			url: 'http://192.168.0.110',
			port: '30010',
			publicKey: "abc"
		}
	];
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
	}

	setNodeInfo(nodes: INode[]) {
		this.nodeInfo = nodes;
	}

	public async broadcast(method: HttpRequestMethod, endpoint: HttpRequestEndpoint, body?: any) {
		logger.info(`Broadcast ${method} /${endpoint}`);
		try {
			await Promise.all(
				this.nodeInfo.map((node) => {
					if (node.url === this.url) return;
					return fetch(`${node.url}:${node.port}/${endpoint}`, {
						method,
						body
					});
				})
			);
		} catch (error) {
			logger.error(error);
		}
	}

	public getWalletBalance() {}
}
