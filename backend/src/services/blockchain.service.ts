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

	validateBlock(index: number) {
		if (index === 0) return;

		const currentBlock = this.getBlock(index);

		// Current block hash matches verifiable data
		if (hash(this.getValidatableBlockData(currentBlock)) !== currentBlock.currentHash)
			throw new Error(`Invalid block ${currentBlock.index}, bad hash`);

		// Previous block is genesis block
		if (index - 1 === 0) return;
		const previousBlock = this.getBlock(index - 1);

		// Previous hash of current block matches hash of previous block
		if (hash(this.getValidatableBlockData(previousBlock)) !== currentBlock.previousHash)
			throw new Error(`Invalid block ${currentBlock.index}, bad previous hash`);

		logger.info(`Block ${currentBlock.index} validated`);
	}

	validateChain() {
		try {
			for (let block of this.chain.blocks) {
				if (block.index === 0) continue;

				this.validateBlock(block.index);
			}

			logger.info('Blockchain validated');
		} catch (error) {
			throw error;
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

	setGenesisBlock(genesisBlock: IBlock) {
		this.chain.blocks = [genesisBlock];
	}
}
