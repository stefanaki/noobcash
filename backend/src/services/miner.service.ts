import logger from '../utilities/logger';
import Block from '../entities/block.entity';
import hash from '../utilities/hash';
import config from '../config';

const MAX_INT = Number.MAX_SAFE_INTEGER;

class MinerService {
    private isMiningAborted = false;
    private isMining = false;
    public totalMiningTime = 0;

    constructor() {}

    isNodeMining() {
        return this.isMining;
    }

    abortMining() {
        this.isMiningAborted = true;
    }

    async mineBlock(b: Block): Promise<boolean> {
        this.isMiningAborted = false;
        this.isMining = true;
        logger.warn(`Mining block ${b.index}...`);

        const startTime = Date.now();
        const target = '0'.repeat(config.difficulty);

        let nonce = Math.floor(Math.random() * MAX_INT);

        let currentHash: string = '';
        while (true) {
            currentHash = hash({
                index: b.index,
                transactions: b.transactions,
                nonce: nonce,
                previousHash: b.previousHash,
            });

            if (currentHash.startsWith(target)) {
                let miningTime = Date.now() - startTime;
                logger.warn(`Found nonce: ${currentHash} in ${miningTime} ms`);
                this.totalMiningTime += miningTime;
                b.nonce = nonce;
                b.currentHash = currentHash;
                this.isMining = false;
                return true;
            }

            nonce++;

            await new Promise(resolve => setTimeout(resolve));
            if (this.isMiningAborted) {
                logger.warn('Mining aborted');
                this.isMining = false;
                return false;
            }
        }
    }
}

export default new MinerService();
