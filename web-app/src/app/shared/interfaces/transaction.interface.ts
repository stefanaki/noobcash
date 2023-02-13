export default interface ITransaction {
  recipientId: number;
  transactionType: 'CREDIT' | 'DEBIT';
  timestamp: string;
  transactionId: string;
  senderAddress: string;
  receiverAddress: string;
  amount: number;
}
