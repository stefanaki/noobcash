import config from "../config";
import INode from "../interfaces/node.interface";
import IWallet from "src/interfaces/wallet.interface";
import Wallet from "./wallet.entity";
import logger from "../utilities/logger";

export default class Node implements INode {
    wallet: IWallet;
    url: string;
    port: string | number;

    constructor() {
        this.url = config.url;
        this.port = config.port;
        this.wallet = this.generateWallet();
        logger.info("Noobcash node initialized")
    }

    public generateWallet() {
        return new Wallet();
    }
}