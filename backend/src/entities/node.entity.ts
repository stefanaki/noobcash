import config from '../config';
import INode from '../interfaces/node.interface';
import IWallet from '../interfaces/wallet.interface';
import Wallet from './wallet.entity';
import logger from '../utilities/logger';
import Transaction from './transaction.entity';

export default class Node implements INode {
	wallet: IWallet;
	url: string;
	port: string | number;

	constructor() {
		this.url = config.url;
		this.port = config.port;
		this.wallet = new Wallet();
		logger.info('Noobcash node initialized');
	}

	public signTransaction(transaction: Transaction) {
		transaction.signature = this.wallet.publicKey; //????
	}

	public verifyTransaction(transaction: Transaction) {}
}
