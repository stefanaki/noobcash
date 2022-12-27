import IBlockchain from '../interfaces/blockchain.interface';
import logger from '../utilities/logger';
import IBlock from '../interfaces/block.interface';
import hash from '../utilities/hash';

export default class BlockchainService {
	private static instance: BlockchainService;

	private chain: IBlockchain = {
		blocks: []
	};

	private constructor() {}

	public static getInstance(): BlockchainService {
		if (!BlockchainService.instance) {
			BlockchainService.instance = new BlockchainService();
		}

		return this.instance;
	}

	getBlock(index: number): IBlock {
		const block = this.chain.blocks.find((block) => block.index === index);

		if (!block) throw new Error('Invalid block index');

		return block;
	}

	validateBlock(index: number): boolean {
		if (index === 0) return true;

		try {
			const currentBlock = this.getBlock(index);
			const previousBlock = this.getBlock(index - 1);

			// Current block hash matches verifiable data
			if (hash(this.getValidatableBlockData(currentBlock)) !== currentBlock.currentHash)
				return false;

			// Previous block is genesis block
			if (index - 1 === 0) return true;

			// Previous hash of current block matches hash of previous block
			if (hash(this.getValidatableBlockData(previousBlock)) !== currentBlock.previousHash)
				return false;
		} catch (error) {
			logger.error(error);
			return false;
		}
		return true;
	}

	validateChain(): boolean {
		try {
			for (let block of this.chain.blocks) {
				if (block.index === 0) continue;

				if (!this.validateBlock(block.index)) return false;
			}

			logger.info('Blockchain validated');
			return true;
		} catch (error) {
			logger.error('Blockchain could not be validated');
			throw new Error('Invalid blockchain');
		}
	}

	getValidatableBlockData(b: IBlock) {
		return {
			index: b.index,
			timestamp: b.timestamp,
			transactions: b.transactions,
			nonce: b.nonce,
			previousHash: b.previousHash
		};
	}
}
