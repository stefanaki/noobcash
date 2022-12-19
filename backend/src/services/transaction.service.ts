export default class TransactionService {
    private static instance: TransactionService;

    private constructor() {}

    public static getInstance(): TransactionService {
        if (!TransactionService.instance) {
            TransactionService.instance = new TransactionService();
        }

        return this.instance;
    }
}