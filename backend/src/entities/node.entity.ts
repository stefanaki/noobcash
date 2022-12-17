import config from '../config';
import INode from '../interfaces/node.interface';
import IWallet from '../interfaces/wallet.interface';
import Wallet from './wallet.entity';
import logger from '../utilities/logger';
import fetch from 'node-fetch';

type HttpRequestMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export default class Node implements INode {
	wallet: IWallet;
	url: string;
	port: string;
	nodeInfo: INode[];

	constructor() {
		this.url = config.url;
		this.port = config.port;
		this.wallet = new Wallet();
		logger.info('Noobcash node initialized');
	}

	protected async broadcast(
		method: HttpRequestMethod,
		endpoint: string,
		body: any
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
}
