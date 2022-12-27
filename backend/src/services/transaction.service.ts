import { sign, verify } from 'crypto';
import logger from '../utilities/logger';
import config from '../config';
import Transaction from '../entities/transaction.entity';
import { IUnspentTransactionOutput } from '../interfaces/transaction.interface';
import TransactionInput from '../entities/transaction-input.entity';
import TransactionOutput from '../entities/transaction-output.entity';

export default class TransactionService {
	private static instance: TransactionService;

	private constructor() {}

	public static getInstance(): TransactionService {
		if (!TransactionService.instance) {
			TransactionService.instance = new TransactionService();
		}

		return this.instance;
	}

	verifySignature(t: Transaction): boolean {
		if (!t.signature) return false;

		const signatureData = this.getVerifiableTransactionData(t);

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

	signTransaction(t: Transaction, privateKey: string) {
		const signatureData = this.getVerifiableTransactionData(t);

		t.signature = sign('sha256', Buffer.from(JSON.stringify(signatureData)), {
			key: privateKey,
			passphrase: config.passphrase
		});
	}

	validateTransaction(t: Transaction) {}

	findTransactionInputs(
		t: Transaction,
		senderUtxos: IUnspentTransactionOutput
	): {
		newTransactionInputs: TransactionInput[];
		toBeSpentUtxos: TransactionOutput[];
		totalUtxoAmount: number;
	} | null {
		let totalUtxoAmount = 0;
		let toBeSpentUtxos: TransactionOutput[] = [];

		for (let utxo of senderUtxos.utxos) {
			if (totalUtxoAmount >= t.amount) break;

			totalUtxoAmount += utxo.amount;
			toBeSpentUtxos.push(utxo);
		}

		if (totalUtxoAmount < t.amount) {
			logger.error(`Transaction ${t.transactionId} failed, not enough coins`);
			return null;
		}

		logger.info(`Found enough UTXO's to fulfill transaction ${t.transactionId}`);

		let newTransactionInputs = toBeSpentUtxos.map(
			(utxo): TransactionInput => new TransactionInput(utxo.outputId, utxo.amount)
		);

		return {
			newTransactionInputs,
			toBeSpentUtxos,
			totalUtxoAmount
		};
	}

	createTransactionOutputs(t: Transaction, totalUtxoAmount: number): TransactionOutput[] {
		let newTransactionOutputs: TransactionOutput[] = [
			new TransactionOutput(t.transactionId, t.receiverAddress, t.amount)
		];

		if (totalUtxoAmount > t.amount) {
			newTransactionOutputs.push(
				new TransactionOutput(t.transactionId, t.senderAddress, totalUtxoAmount - t.amount)
			);
		}

		return newTransactionOutputs;
	}

	getVerifiableTransactionData(t: Transaction) {
		return {
			transactionId: t.transactionId,
			senderAddress: t.senderAddress,
			receiverAddress: t.receiverAddress,
			amount: t.amount
		};
	}
}
