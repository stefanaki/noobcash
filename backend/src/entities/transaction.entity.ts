import hash from '../utilities/hash';
import ITransaction, {
    ITransactionInput,
    ITransactionOutput,
} from '../interfaces/transaction.interface';
import logger from '../utilities/logger';

export default class Transaction implements ITransaction {
    transactionId: string;
    senderAddress: string;
    receiverAddress: string;
    amount: number;
    timestamp: number;
    signature?: Buffer;
    transactionInputs: ITransactionInput[];
    transactionOutputs: ITransactionOutput[];

    constructor({
        transactionId,
        timestamp,
        senderAddress,
        receiverAddress,
        amount,
        signature,
        transactionInputs,
        transactionOutputs,
    }: {
        transactionId?: string;
        timestamp?: number;
        senderAddress: string;
        receiverAddress: string;
        amount: number;
        signature?: Buffer;
        transactionInputs?: ITransactionInput[];
        transactionOutputs?: ITransactionOutput[];
    }) {
        this.senderAddress = senderAddress;
        this.receiverAddress = receiverAddress;
        this.amount = amount;
        this.signature = signature;
        this.timestamp = timestamp ?? Date.now();
        this.transactionInputs = transactionInputs ?? [];
        this.transactionOutputs = transactionOutputs ?? [];

        this.transactionId =
            transactionId ??
            hash({
                senderAddress,
                receiverAddress,
                amount,
                timestamp: this.timestamp,
            });

        logger.info(`Transaction with ID ${this.transactionId} created`);
    }
}
