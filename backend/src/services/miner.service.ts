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
		this.isMiningAborted = false;
		logger.info('Mining started');
	
		const startTime = Date.now();
		const maxIterations = 100000000; // Adjust as needed
		const target = '0'.repeat(config.difficulty);
	
		let nonce = Math.floor(Math.random() * MY_MAX_INT);
	
		let currentHash: string = '';
		for (let i = 0; i < maxIterations; i++) {
			currentHash = hash({
				index: b.index,
				transactions: b.transactions,
				nonce: nonce,
				previousHash: b.previousHash
			});
	
			if (currentHash.startsWith(target)) {
				logger.info(`Found nonce: ${currentHash} in ${Date.now() - startTime} ms`);
				b.nonce = nonce;
				b.currentHash = currentHash;
				return b;
			}
	
			nonce++;
	
			await new Promise((resolve) => setTimeout(resolve));
			if (this.isMiningAborted) {
				logger.info('Mining aborted');
				return null;
			}
		}
	
		logger.info('Failed to find a valid nonce');
		return null;
	}
}
