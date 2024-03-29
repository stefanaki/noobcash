export default interface ITransaction {
    transactionId: string;
    senderAddress: string;
    receiverAddress: string;
    amount: number;
    timestamp: number;
    signature?: Buffer;
    transactionInputs: ITransactionInput[];
    transactionOutputs: ITransactionOutput[];
}

export interface ITransactionInput {
    previousOutputId: string;
    amount: number;
}

export interface ITransactionOutput {
    outputId: string;
    transactionId: string;
    receiverAddress: string;
    amount: number;
}
