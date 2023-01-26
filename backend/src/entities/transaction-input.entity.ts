import { ITransactionInput } from '../interfaces/transaction.interface';

export default class TransactionInput implements ITransactionInput {
    previousOutputId: string;
    amount: number;

    constructor(prevOutputId: string, amount: number) {
        this.previousOutputId = prevOutputId;
        this.amount = amount;
    }
}
