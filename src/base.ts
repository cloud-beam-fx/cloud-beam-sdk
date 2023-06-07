import {ethers ,Wallet , Signer} from 'ethers';

type config = {
    rpcUrl: string,
    funcClientAddress: string,
    funcRegAddress: string,
    payMasterAddress: string,
}

export abstract class Base {
    private rpcUrl: string;
    private funcClientAddress: string;
    private funcRegAddress: string;
    private payMasterAddress: string;

    constructor(config: config) {
        this.rpcUrl = config.rpcUrl;
        this.funcClientAddress = config.funcClientAddress || '';
        this.funcRegAddress = config.funcRegAddress || '';
        this.payMasterAddress = config.payMasterAddress || '';
    }

    protected async provider(): Promise<any> {
        return new ethers.providers.JsonRpcProvider(this.rpcUrl);
    }

    protected async getFuncClientAddress(): Promise<string> {
        return this.funcClientAddress;
    }

    protected async getFuncRegAddress(): Promise<string> {
        return this.funcRegAddress;
    }

    protected async getPayMasterAddress(): Promise<string> {
        return this.payMasterAddress;
    }

    protected async getFeeData(): Promise<any> {
        try{
            let provider = await this.provider();
            let feeData = await provider.getFeeData();
            let fee = {
                maxFeePerGas: feeData.maxFeePerGas,
                maxPriorityFeePerGas: feeData.maxPriorityFeePerGas,
                gasLimit: 5e6,
            }

            return fee;
        }catch(e){
            console.log(e.message);
            throw new Error(e.message);
        }
    }
}