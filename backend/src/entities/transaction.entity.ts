import { sign, verify } from 'crypto';
import config from '../config';
import hash from '../utilities/hash';
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
		timestamp?: Date;
		senderAddress: string;
		receiverAddress: string;
		amount: number;
		signature?: Buffer;
		transactionInputs: ITransactionInput[];
		transactionOutputs: ITransactionOutput[];
	}) {
		this.transactionId =
			transactionId ??
			hash({
				senderAddress,
				receiverAddress,
				amount,
				timestamp
			});

		this.senderAddress = senderAddress;
		this.receiverAddress = receiverAddress;
		this.amount = amount;
		this.signature = signature;
		this.timestamp = timestamp ?? new Date();
		this.transactionInputs = transactionInputs;
		this.transactionOutputs = transactionOutputs;
	}

	static verifySignature(t: Transaction): boolean {
		if (!t.signature) return false;

		const signatureData = {
			transactionId: t.transactionId,
			senderAddress: t.senderAddress,
			receiverAddress: t.receiverAddress,
			amount: t.amount
		};

		try {
			verify(
				'sha256',
				Buffer.from(JSON.stringify(signatureData)),
				t.senderAddress,
				Buffer.from(t.signature)
			);

			return true;
		} catch {
			return false;
		}
	}

	static signTransaction(t: Transaction, privateKey: string) {
		const signatureData = {
			transactionId: t.transactionId,
			senderAddress: t.senderAddress,
			receiverAddress: t.receiverAddress,
			amount: t.amount
		};
		t.signature = sign(
			'sha256',
			Buffer.from(JSON.stringify(signatureData)),
			{
				key: privateKey,
				passphrase: config.passphrase
			}
		);
	}
}
