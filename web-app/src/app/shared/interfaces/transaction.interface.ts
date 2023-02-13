export default interface ITransaction {
  recipientId: number;
  senderId: number;
  transactionType: 'CREDIT' | 'DEBIT';
  timestamp: string;
  transactionId: string;
  senderAddress: string;
  receiverAddress: string;
  amount: number;
}
