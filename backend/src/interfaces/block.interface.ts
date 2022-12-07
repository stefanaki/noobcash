import Transaction from "./transaction.interface";

export default interface IBlock {
    index: number;
    timestamp: Date;
    transactions: Transaction[];
    nonce: number;
    currentHash: string;
    previousHash: string;
}