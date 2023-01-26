import ITransaction from './transaction.interface';

export default interface IBlock {
    index: number;
    timestamp: number;
    transactions: ITransaction[];
    nonce: number;
    currentHash: string;
    previousHash: string;
}
