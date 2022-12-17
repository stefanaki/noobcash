import ITransaction from "./transaction.interface";

export default interface IBlock {
    index: number;
    timestamp: Date;
    transactions: ITransaction[];
    nonce: number;
    currentHash: string;
    previousHash: string;
}