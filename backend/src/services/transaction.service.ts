import { sign, verify } from 'crypto';
import logger from '../utilities/logger';
import config from '../config';
import Transaction from '../entities/transaction.entity';
import TransactionInput from '../entities/transaction-input.entity';
import TransactionOutput from '../entities/transaction-output.entity';
import ITransaction, { ITransactionOutput } from 'src/interfaces/transaction.interface';
import NoobcashException from '../utilities/noobcash-exception';

class TransactionService {
    private utxos: Map<string, ITransactionOutput[]> = new Map();
    public pendingTransactions: ITransaction[] = [];

    constructor() {}

    verifySignature(t: Transaction): boolean {
        if (!t.signature) return false;

        const signatureData = this.getVerifiableTransactionData(t);

        try {
            verify(
                'sha256',
                Buffer.from(JSON.stringify(signatureData)),
                t.senderAddress,
                Buffer.from(t.signature),
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
            passphrase: config.passphrase,
        });
    }

    validateTransaction(t: Transaction) {
        // Check if the signature of the transaction is valid
        if (!this.verifySignature(t)) {
            throw new NoobcashException(
                `Transaction ${t.transactionId} failed, invalid signature`,
                400,
            );
        }

        // Check if sender has any UTXO's at all
        let senderUtxos = this.utxos.get(t.senderAddress);
        if (!senderUtxos) {
            throw new NoobcashException(
                `Transaction ${t.transactionId} failed, no UTXO's found`,
                400,
            );
        }

        // Find sender UTXO's that can fulfill the transaction and set them as TransactionInputs
        const { newTransactionInputs, toBeSpentUtxos, totalUtxoAmount } =
            this.findTransactionInputs(t, senderUtxos);
        this.setTransactionInputs(t, newTransactionInputs);

        // Calculate the transaction outputs
        const newTransactionOutputs = this.createTransactionOutputs(t, totalUtxoAmount);
        this.setTransactionOutputs(t, newTransactionOutputs);

        // Filter out the sender's UTXO's that are needed for the transaction
        const updatedSenderUtxos = senderUtxos.filter(utxo => !toBeSpentUtxos.includes(utxo));

        // Fetch new receiver's UTXO and append it to receiver's total UTXO's
        const newReceiverUtxo = newTransactionOutputs[0];
        const receiverUtxos = this.utxos.get(t.receiverAddress);
        if (!receiverUtxos) {
            this.utxos.set(t.receiverAddress, [newReceiverUtxo]);
        } else {
            receiverUtxos.push(newReceiverUtxo);
        }

        if (newTransactionOutputs.length < 2) {
            this.utxos.set(t.senderAddress, updatedSenderUtxos);
            return;
        }

        // If newTransactionOutputs length is 2, there is also another
        // UTXO for the change of the sender
        updatedSenderUtxos.push(newTransactionOutputs[1]);
        this.utxos.set(t.senderAddress, updatedSenderUtxos);

        logger.info(`Transaction ${t.transactionId} validated`);
    }

    findTransactionInputs(t: Transaction, senderUtxos: ITransactionOutput[]) {
        let totalUtxoAmount = 0;
        let toBeSpentUtxos: TransactionOutput[] = [];
        let newTransactionInputs: TransactionInput[] = [];

        for (const utxo of senderUtxos) {
            if (totalUtxoAmount >= t.amount) break;

            totalUtxoAmount += utxo.amount;
            toBeSpentUtxos.push(utxo);
            newTransactionInputs.push(new TransactionInput(utxo.outputId, utxo.amount));
        }

        if (totalUtxoAmount < t.amount) {
            throw new NoobcashException(
                `Transaction ${t.transactionId} failed, not enough coins`,
                400,
            );
        }

        return {
            newTransactionInputs,
            toBeSpentUtxos,
            totalUtxoAmount,
        };
    }

    createTransactionOutputs(t: Transaction, totalUtxoAmount: number): TransactionOutput[] {
        let newTransactionOutputs: TransactionOutput[] = [
            new TransactionOutput(t.transactionId, t.receiverAddress, t.amount),
        ];

        if (totalUtxoAmount > t.amount) {
            newTransactionOutputs.push(
                new TransactionOutput(t.transactionId, t.senderAddress, totalUtxoAmount - t.amount),
            );
        }

        return newTransactionOutputs;
    }

    getVerifiableTransactionData(t: Transaction) {
        return {
            transactionId: t.transactionId,
            senderAddress: t.senderAddress,
            receiverAddress: t.receiverAddress,
            amount: t.amount,
        };
    }

    setTransactionInputs(t: Transaction, transactionInputs: TransactionInput[]) {
        t.transactionInputs = transactionInputs;
    }

    setTransactionOutputs(t: Transaction, transactionOutputs: TransactionOutput[]) {
        t.transactionOutputs = transactionOutputs;
    }

    getUtxos(address: string) {
        return this.utxos.get(address);
    }

    setInitialUtxo(address: string, transactionOutput: TransactionOutput) {
        this.utxos.set(address, [transactionOutput]);
    }

    setUtxos(utxos: Map<string, ITransactionOutput[]>) {
        this.utxos = utxos;
    }

    getAllUtxos() {
        return this.utxos;
    }

    enqueueTransaction(t: Transaction) {
        this.pendingTransactions.push(t);
        this.pendingTransactions.sort((a, b) => a.timestamp - b.timestamp);
    }

    pendingTransactionsExist() {
        return this.pendingTransactions.length > 0;
    }

    dequeuePendingTransactions(count: number) {
        return this.pendingTransactions.splice(0, count);
    }

    getPendingTransactions() {
        return this.pendingTransactions;
    }

    setPendingTransactions(pendingTransactions: ITransaction[]) {
        this.pendingTransactions = pendingTransactions;
    }
}

export default new TransactionService();
