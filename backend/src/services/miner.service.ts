import IBlock from "../interfaces/block.interface";

export default class MinerService {
    private static instance: MinerService;

    private constructor() {}

    public static getInstance(): MinerService {
        if (!MinerService.instance) {
            MinerService.instance = new MinerService();
        }

        return this.instance;
    }

    mineBlock(block: IBlock) {

    }
}