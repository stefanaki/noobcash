import IWallet from './wallet.interface';

export default interface INode {
    url: string;
    port: string | number;
    wallet: IWallet;
}