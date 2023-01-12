import logger from '../utilities/logger';
import IBlock from '../interfaces/block.interface';
import hash from '../utilities/hash';
import config from '../config';

const MY_MAX_INT = 8589934592;

export default class MinerService {
	private static instance: MinerService;

	private isMiningAborted = false;

	private constructor() {}

	public static getInstance(): MinerService {
		if (!MinerService.instance) {
			MinerService.instance = new MinerService();
		}

		return this.instance;
	}

	abortMining() {
		this.isMiningAborted = true;
	}

	async mineBlock(b: IBlock): Promise<IBlock | null> {
		logger.warn('Mining started');

		const startTime = Date.now();

		let i = Math.floor(Math.random() * MY_MAX_INT);

		let currentHash: string = '';
		const zeros = '0'.repeat(config.difficulty);

		while (true) {
			currentHash = hash({
				index: b.index,
				//timestamp: b.timestamp,
				transactions: b.transactions,
				nonce: i,
				previousHash: b.previousHash
			});

			if (currentHash.startsWith(zeros)) {
				logger.info(`Found nonce: ${currentHash} in ${Date.now() - startTime}ms`);
				b.nonce = i
				b.currentHash = currentHash;
				break;
			}
			i = (i + 1) % MY_MAX_INT;

			await new Promise((resolve) => setTimeout(resolve));
			if (this.isMiningAborted) {
				logger.warn('Mining aborted');
				this.isMiningAborted = false;
				return null;
				
			}
		}

		return b;
	}
}
