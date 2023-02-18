import ITransaction from '../interfaces/transaction.interface';
import IBlock from '../interfaces/block.interface';

export default class Block implements IBlock {
    index: number;
    timestamp: number;
    transactions: ITransaction[];
    nonce: number;
    currentHash: string;
    previousHash: string;

    constructor(
        index: number,
        previousHash: string,
        currentHash: string = '',
        timestamp: number = Date.now(),
        transactions: ITransaction[] = [],
        nonce: number = 0,
    ) {
        this.index = index;
        this.timestamp = timestamp;
        this.transactions = transactions;
        this.previousHash = previousHash;
        this.currentHash = currentHash;
        this.nonce = nonce;
    }
}
