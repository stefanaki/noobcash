import IBlock from "../interfaces/block.interface";
import IBlockchain from "../interfaces/blockchain.interface";
import ITransaction from "../interfaces/transaction.interface";
import IWallet from "../interfaces/wallet.interface";

export default abstract class NoobcashNode {
    public abstract generateWallet(): IWallet; // OK
    public abstract createTransaction(): ITransaction; // OK
    public abstract signTransaction(transaction: ITransaction): void; // OK
    public abstract broadcastTransaction(transaction: ITransaction): void; // OK
    public abstract verifySignature(transaction: ITransaction): void; // OK
    public abstract validateTransaction(transaction: ITransaction): void;
    public abstract getWalletBalance(wallet: IWallet): void;
    public abstract mineBlock(block: IBlock): void;
    public abstract broadcastBlock(block: IBlock): void;
    public abstract validateBlock(block: IBlock): void; // OK
    public abstract validateChain(chain: IBlockchain): void; // OK
    public abstract resolveConflicts(block: IBlock): void;
}