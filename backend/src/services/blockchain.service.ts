export default class BlockchainService {
    private static instance: BlockchainService;

    private constructor() {}

    public static getInstance(): BlockchainService {
        if (!BlockchainService.instance) {
            BlockchainService.instance = new BlockchainService();
        }

        return this.instance;
    }
}