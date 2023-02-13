import IBlock from "./block.interface";
import IBlockchain from "./blockchain.interface";
import INode from "./node.interface";
import ITransaction, { ITransactionOutput } from "./transaction.interface";

export interface LatestBlockTransactionsDto {
    recipientId: number;
    senderId: number;
    transactionType: 'CREDIT' | 'DEBIT',
    timestamp: string;
    transactionId: string;
    senderAddress: string;
    receiverAddress: string;
    amount: number;
}

export interface BlockchainDto {
    blockchain: IBlockchain;
    currentBlock: IBlock;
    utxos: { [key: string]: ITransactionOutput[] };
    pendingTransactions: ITransaction[]
}

export interface NodeDto {
    node: INode;
}

export interface RingDto {
    ring: INode[];
}

export interface TransactionDto {
    transaction: ITransaction;
}

export interface BalanceDto {
    balance: number;
}