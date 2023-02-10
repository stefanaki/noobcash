import IBlockchain from '../interfaces/blockchain.interface';
import logger from '../utilities/logger';
import IBlock from '../interfaces/block.interface';
import hash from '../utilities/hash';
import Transaction from '../entities/transaction.entity';
import NoobcashException from '../utilities/noobcash-exception';

class BlockchainService {
    private chain: IBlockchain = {
        blocks: [],
    };

    private currentBlock: IBlock = {
        currentHash: '0',
        previousHash: '0',
        nonce: 1,
        index: 0,
        timestamp: Date.now(),
        transactions: [],
    };

    constructor() {}

    getBlock(chain: IBlockchain = this.chain, index: number): IBlock {
        return chain.blocks[index];
    }

    validateBlock(chain: IBlockchain = this.chain, block: IBlock) {
        if (block.index === 0) return;

        // Current block hash matches verifiable data
        if (hash(this.getValidatableBlockData(block)) !== block.currentHash)
            throw new NoobcashException(
                `Invalid block ${block.index}, bad hash, ${block.currentHash}`,
                500,
            );

        // Previous block is genesis block
        if (block.index - 1 === 0) return;
        const previousBlock = this.getBlock(chain, block.index - 1);

        // Previous hash of current block matches hash of previous block
        if (hash(this.getValidatableBlockData(previousBlock)) !== block.previousHash)
            throw new NoobcashException(`Invalid block ${block.index}, bad previous hash`, 500);
    }

    validateChain(chain: IBlockchain = this.chain) {
        try {
            for (let block of chain.blocks) {
                if (block.index === 0) continue;

                this.validateBlock(chain, block);
            }

            // logger.info('Blockchain validated');
        } catch (error) {
            logger.error(error);
            throw new NoobcashException(`Chain not validated`, 500);
        }
    }

    getValidatableBlockData(b: IBlock) {
        return {
            index: b.index,
            // timestamp: b.timestamp,
            transactions: b.transactions,
            nonce: b.nonce,
            previousHash: b.previousHash,
        };
    }

    setBlockchain(blockchain: IBlockchain) {
        this.validateChain(blockchain);
        this.chain = blockchain;
    }

    setGenesisBlock(genesisBlock: IBlock) {
        this.chain.blocks = [];
        this.currentBlock = genesisBlock;
    }

    getChain() {
        return this.chain;
    }

    insertBlock(b: IBlock) {
        if (b.index < this.currentBlock.index) return;
        
        this.validateBlock(this.chain, b);

        this.chain.blocks.push(b);

        const newBlock: IBlock = {
            index: b.index + 1,
            currentHash: '',
            nonce: 0,
            previousHash: '',
            timestamp: Date.now(),
            transactions: [],
        };

        const newBlockCurrentHash = hash(this.getValidatableBlockData(newBlock));
        newBlock.currentHash = newBlockCurrentHash;
        newBlock.previousHash = b.currentHash;

        this.currentBlock = newBlock;
        this.validateChain(this.chain);
    }

    getCurrentBlock() {
        return this.currentBlock;
    }

    getLatestMinedBlock() {
        const latestBlockIndex = this.chain.blocks.length - 1;

        if (latestBlockIndex === -1)
            throw new NoobcashException('No blocks have been mined yet', 500);

        return this.chain.blocks[latestBlockIndex];
    }

    appendTransactionToCurrentBlock(t: Transaction) {
        this.currentBlock.transactions.push(t);
    }

    updateCurrentBlockHash() {
        this.currentBlock.currentHash = hash(this.getValidatableBlockData(this.currentBlock));
    }

    setCurrentBlock(currentBlock: IBlock) {
        this.currentBlock = currentBlock;
    }
}

export default new BlockchainService();
