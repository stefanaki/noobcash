import ITransaction, {
	ITransactionInput,
	ITransactionOutput
} from '../interfaces/transaction.interface';

export default class Transaction implements ITransaction {
	transactionId: string;
	senderAddress: string;
	receiverAddress: string;
	amount: number;
	timestamp: Date;
	signature: string;
	transactionInputs: ITransactionInput[];
	transactionOutputs: ITransactionOutput[];
}
