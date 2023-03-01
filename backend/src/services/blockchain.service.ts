import IBlockchain from '../interfaces/blockchain.interface';
import logger from '../utilities/logger';
import hash from '../utilities/hash';
import Transaction from '../entities/transaction.entity';
import NoobcashException from '../utilities/noobcash-exception';
import transactionService from './transaction.service';
import Block from '../entities/block.entity';

class BlockchainService {
    private chain: IBlockchain = {
        blocks: [],
    };

    private currentBlock = new Block(0, '0', '0');

    constructor() {}

    getBlock(chain: IBlockchain = this.chain, index: number): Block {
        return chain.blocks[index];
    }

    validateBlock(chain: IBlockchain = this.chain, block: Block) {
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
        } catch (error) {
            logger.error(error);
            throw new NoobcashException(`Chain not validated`, 500);
        }
    }

    getValidatableBlockData(b: Block) {
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

    setGenesisBlock(genesisBlock: Block) {
        this.chain.blocks = [];
        this.currentBlock = genesisBlock;
    }

    getChain() {
        return this.chain;
    }

    insertBlock(b: Block) {
        if (b.index < this.currentBlock.index) return;

        this.validateBlock(this.chain, b);

        this.chain.blocks.push(b);

        const newBlock = new Block(b.index + 1, b.currentHash);
        const newBlockCurrentHash = hash(this.getValidatableBlockData(newBlock));
        newBlock.currentHash = newBlockCurrentHash;

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

    setCurrentBlock(currentBlock: Block) {
        this.currentBlock = currentBlock;
    }

    getNodeStateChecksum(): string {
        return hash({
            currentBlockIndex: this.currentBlock.index,
            blockchain: this.getChain(),
            transactionQueue: transactionService.getPendingTransactionsArray(),
            utxos: transactionService.getAllUtxos(),
        });
    }

    validateStateChecksum(stateChecksum: string) {
        const localStateChecksum = this.getNodeStateChecksum();

        if (localStateChecksum !== stateChecksum) {
            throw new NoobcashException(`State checksum validation failed`, 500);
        }
    }
}

export default new BlockchainService();
