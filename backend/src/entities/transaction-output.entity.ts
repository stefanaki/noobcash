import hash from "../utilities/hash";
import { ITransactionOutput } from "../interfaces/transaction.interface";

export default class TransactionOutput implements ITransactionOutput {
	outputId: string;
	transactionId: string;
	receiverAddress: string;
	amount: number;

	constructor(
		transactionId: string,
		receiverAddress: string,
		amount: number,
		outputId?: string
	) {
		this.outputId = outputId ?? hash({
			transactionId,
			receiverAddress,
			amount
		});

		this.transactionId = transactionId;
		this.receiverAddress = receiverAddress;
		this.amount = amount;
	}
}