import config from '../config';
import INode from '../interfaces/node.interface';
import IWallet from '../interfaces/wallet.interface';
import Wallet from './wallet.entity';
import logger from '../utilities/logger';
import fetch from 'node-fetch';
import TransactionService from '../services/transaction.service';
import MinerService from '../services/miner.service';
import BlockchainService from '../services/blockchain.service';

type HttpRequestMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export default class Node implements INode {
	wallet: IWallet;
	url: string;
	port: string;
	nodeInfo: INode[] = [
		{
			url: "http://192.168.0.18",
			port: "3008"
		},
		{
			url: "http://192.168.0.19",
			port: "3009"
		},
		{
			url: "http://192.168.0.110",
			port: "30010"
		}
	];
	transactionService: TransactionService;
	minerService: MinerService;
	blockchainService: BlockchainService;

	constructor() {
		this.url = config.url;
		this.port = config.port;
		this.wallet = new Wallet();
		this.transactionService = TransactionService.getInstance();
		this.minerService = MinerService.getInstance();
		this.blockchainService = BlockchainService.getInstance();
		logger.info('Noobcash node initialized');
	}

	public async broadcast(
		method: HttpRequestMethod,
		endpoint: string,
		body?: any
	) {
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

	public getWalletBalance() {
		
	}
}
