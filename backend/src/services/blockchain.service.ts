import IBlockchain from '../interfaces/blockchain.interface';
import logger from '../utilities/logger';
import IBlock from '../interfaces/block.interface';
import hash from '../utilities/hash';
import Transaction from '../entities/transaction.entity';

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

	getBlock(chain: IBlockchain, index: number): IBlock {
		return chain.blocks[index];
	}

	validateBlock(chain: IBlockchain, index: number) {
		if (index === 0) return;

		const block = this.getBlock(chain, index);

		// Current block hash matches verifiable data
		if (hash(this.getValidatableBlockData(block)) !== block.currentHash)
			throw new Error(`Invalid block ${block.index}, bad hash,,, ${block.currentHash}`);

		// Previous block is genesis block
		if (block.index - 1 === 0) return;
		const previousBlock = this.getBlock(chain, block.index - 1);

		// Previous hash of current block matches hash of previous block
		if (hash(this.getValidatableBlockData(previousBlock)) !== block.previousHash)
			throw new Error(`Invalid block ${block.index}, bad previous hash`);

		// logger.info(`Block ${block.index} validated`);
	}

	async validateChain(chain: IBlockchain = this.chain) {
		try {
			for (let block of chain.blocks) {
				if (block.index === 0) continue;

				this.validateBlock(chain, block.index);
			}

			logger.info('Blockchain validated');
		} catch (error) {
			logger.error('Chain not validated, trying to resolve conflicts');
			throw error;
		}
	}

	getValidatableBlockData(b: IBlock) {
		return {
			index: b.index,
			// timestamp: b.timestamp, // sneaky
			transactions: b.transactions,
			nonce: b.nonce,
			previousHash: b.previousHash
		};
	}

	setBlockchain(blockchain: IBlockchain) {
		this.validateChain(blockchain);
		this.chain = blockchain;
	}

	setGenesisBlock(genesisBlock: IBlock) {
		this.chain.blocks = [genesisBlock];
	}

	getChain() {
		return this.chain;
	}

	insertBlock(b: IBlock) {
		this.validateBlock(this.chain, b.index);

		const i = this.chain.blocks.map(b => b.index).indexOf(b.index);
		this.chain.blocks.splice(i, 1);
		this.chain.blocks.push(b);
		

		const newBlock: IBlock = {
			index: b.index + 1,
			currentHash: "",
			nonce: 0,
			previousHash: b.currentHash,
			timestamp: new Date(),
			transactions: []
		}

		const newBlockCurrentHash = hash(this.getValidatableBlockData(newBlock));
		newBlock.currentHash = newBlockCurrentHash;
		console.info(`new block hash ${newBlockCurrentHash}`);
		this.chain.blocks.push(newBlock);

		this.validateChain(this.chain);
	}

	getLatestBlock() {
		const lastIndex = this.chain.blocks.length - 1;
		return this.chain.blocks[lastIndex];
	}

	appendTransactionToLatestBlock(t: Transaction) {
		const latestBlock = this.getLatestBlock();
		latestBlock.transactions.push(t);
		latestBlock.currentHash = hash(this.getValidatableBlockData(latestBlock));
	}
}
