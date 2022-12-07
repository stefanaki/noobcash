import IBlock from "../interfaces/block.interface";
import IBlockchain from "../interfaces/blockchain.interface";
import ITransaction from "../interfaces/transaction.interface";
import IWallet from "../interfaces/wallet.interface";

export default abstract class NoobcashNode {
    public abstract generateWallet(): IWallet;
    public abstract createTransaction(): ITransaction;
    public abstract signTransaction(transaction: ITransaction): void;
    public abstract broadcastTransaction(transaction: ITransaction): void;
    public abstract verifySignature(transaction: ITransaction): void;
    public abstract validateTransaction(transaction: ITransaction): void;
    public abstract getWalletBalance(wallet: IWallet): void;
    public abstract mineBlock(block: IBlock): void;
    public abstract broadcastBlock(block: IBlock): void;
    public abstract validateBlock(block: IBlock): void;
    public abstract validateChain(chain: IBlockchain): void;
    public abstract resolveConflicts(block: IBlock): void;
}