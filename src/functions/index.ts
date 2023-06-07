import { Base } from "../base"
import { Signer, ethers } from "ethers";
import utils from "./utils/index"

type functions = {
    admin: string;
    caller: string;
    topupToken: string;
    functionId: number;
    status: any;   
}

type functionsRequest = {
    requestId: string;
    functionId: number;
    args: Array<string>;
    returnData: string;
    err: string;
    status: boolean;
}

type token = {
    tokenAddress: string;
    ticker: string;
}

export class Functions extends Base {
    
    public async registerFunction(signer: Signer, approvedCaller: string, topupToken: string): Promise<number> {
        try {
            const funcRegAddress = await this.getFuncRegAddress();
            const funcRegContract = new ethers.Contract(funcRegAddress, utils.funcRegAbi, signer);
            const feeData = await this.getFeeData();
            const registerTx = await funcRegContract.registerFunction(signer.getAddress(), approvedCaller, topupToken, feeData);
            const registerTxReceipt = await registerTx.wait();
            if(registerTxReceipt.status == 0){
                throw new Error("Function registration failed");
            }
            // read the function id from the event logs
            const registerEvent = registerTxReceipt.events?.filter((event: any) => event.event == "NewFunctionRegistered")[0];
            return (registerEvent.args.id).toNumber();

        } catch (e) {
            console.log(e.message);
            throw new Error(e.message);
        }
    }

    public async getRegFunction(id: number): Promise<functions> {
       try{ const provider = await this.provider();
        const funcRegAddress = await this.getFuncRegAddress();
        const funcRegContract = new ethers.Contract(funcRegAddress, utils.funcRegAbi, provider);
        return await funcRegContract.getRegisteredFunction(id);
        }catch(e){
            console.log(e.message);
            throw new Error(e.message);
        }
    }

    public async getAdminFunctions(admin: string): Promise<Array<functions>> {
        try{
            const provider = await this.provider();
            const funcRegAddress = await this.getFuncRegAddress();
            const funcRegContract = new ethers.Contract(funcRegAddress, utils.funcRegAbi, provider);
            return await funcRegContract.getAdminFunctions(admin);
        }catch(e){
            console.log(e.message);
            throw new Error(e.message);
        }
    }

    public async toogleFunctionState(signer: Signer, id: number): Promise<string> {
        try{
            let status: string;
            const funcRegAddress = await this.getFuncRegAddress();
            const funcRegContract = new ethers.Contract(funcRegAddress, utils.funcRegAbi, signer);
            const feeData = await this.getFeeData();
            const toogleTx = await funcRegContract.toogleFunctionState(id, feeData);
            const toogleTxReceipt = await toogleTx.wait();
            if(toogleTxReceipt.status == 0){
                throw new Error("Function status toogle failed");
            }
            const toogleEvent = toogleTxReceipt.events?.filter((event: any) => event.event == "FunctionStateChange")[0];
            console.log(toogleEvent.args.status);
            if(toogleEvent.args.status == 0){
                status = "active";
            }else if(toogleEvent.args.status == 1){
                status = "paused";
            }
            return status; 
        }catch(e){
            console.log(e.message);
            throw new Error(e.message);
        }
    }

    public async topup(signer: Signer, amount: number, topupToken: string): Promise<Boolean> {
        try{
            const feeData = await this.getFeeData();
            const payMasterAddress = await this.getPayMasterAddress();
            if (topupToken === "ETH"){
                let balance = ethers.utils.formatEther(await signer.getBalance());
                if (parseInt(balance) < amount){
                    throw new Error("Insufficient ETH balance");
                }else{
                    //transfer eth to paymaster
                    const payMasterAddress = await this.getPayMasterAddress();
                    const tx = {
                        to: payMasterAddress,
                        value: ethers.utils.parseEther(amount.toString()),
                        from: signer.getAddress(),
                        maxFeePerGas: feeData.maxFeePerGas,
                        maxPriorityFeePerGas: feeData.maxPriorityFeePerGas,
                        gasLimit: feeData.gasLimit,
                    }
                    const txResponse = await signer.sendTransaction(tx);
                    const txReceipt = await txResponse.wait();
                    if(txReceipt.status == 0){
                        throw new Error("Topup failed");
                    };
                    return true;
                }
            }
            const payMaster = new ethers.Contract(payMasterAddress, utils.payMaster, signer);
            const topupTx = await payMaster.topup(signer.getAddress(), topupToken, amount, feeData);
            const topupTxReceipt = await topupTx.wait();
            if(topupTxReceipt.status == 0){
                throw new Error("Topup failed");
            }
            const topUpEvent = topupTxReceipt.events?.filter((event: any) => event.event == "TopUp")[0];
            console.log(topUpEvent.args.success);
            return topUpEvent.args.success;
        }catch(e){
            console.log(e.message);
            throw new Error(e.message);
        }
    }

    public async adminWithdraw(signer: Signer, token: string): Promise<Boolean> {
        try{
            const feeData = await this.getFeeData();
            const payMasterAddress = await this.getPayMasterAddress();
            const payMaster = new ethers.Contract(payMasterAddress, utils.payMaster, signer);
            const withdrawTx = await payMaster.adminWithdraw(token, feeData);
            const withdrawTxReceipt = await withdrawTx.wait();
            if(withdrawTxReceipt.status == 0){
                throw new Error("Withdraw failed");
            }
            const withdrawEvent = withdrawTxReceipt.events?.filter((event: any) => event.event == "AdminWithdrawn")[0];
            console.log(withdrawEvent.args.success);
            return withdrawEvent.args.success;
        }catch(e){
            console.log(e.message);
            throw new Error(e.message);
        }
    }

    public async getAdminBalance(admin: string, token: string): Promise<number> {
        try{
            const provider = await this.provider();
            const payMasterAddress = await this.getPayMasterAddress();
            const payMaster = new ethers.Contract(payMasterAddress, utils.payMaster, provider);
            if (token === "ETH"){
                return parseInt(ethers.utils.formatEther(await payMaster.getAdminBalance(admin, token)));
            }else{
                return parseInt(ethers.utils.formatUnits(await payMaster.getAdminBalance(admin, token), 10));
            }  
        }catch(e){
            console.log(e.message);
            throw new Error(e.message);
        }
    }

    public async makeRequest(signer: Signer, funcId: number, args: Array<string>, source: string, secrets: string): Promise<Object> {
        try{
            const feeData = await this.getFeeData();
            const funcClientAddress = await this.getFuncClientAddress();
            const funcClient = new ethers.Contract(funcClientAddress, utils.funcClientAbi, signer);
            const requestTx = await funcClient.makeRequest(funcId, source, args, secrets, feeData);
            const requestTxReceipt = await requestTx.wait();
            if(requestTxReceipt.status == 0){
                throw new Error("Request failed");
            }
            const requestEvent = requestTxReceipt.events?.filter((event: any) => event.event == "FuncRequest")[0];
            console.log(requestEvent.args.success);
            return {functionId: requestEvent.args.functionId, requestId: requestEvent.args.requestId}
        }catch(e){
            console.log(e.message);
            throw new Error(e.message);
        }
    }

    public async stopFunction(signer: Signer, funcId: number): Promise<any> {
        try{
            const feeData = await this.getFeeData();
            const funcClientAddress = await this.getFuncClientAddress();
            const funcClient = new ethers.Contract(funcClientAddress, utils.funcClientAbi, signer);
            const stopTx = await funcClient.stopFunction(funcId, feeData);
            const stopTxReceipt = await stopTx.wait();
            if(stopTxReceipt.status == 0){
                throw new Error("Function stop failed");
            }
            const stopEvent = stopTxReceipt.events?.filter((event: any) => event.event == "FunctionStopped")[0];
            console.log(stopEvent.args.success);
            return stopEvent.args.success;
        }catch(e){
            console.log(e.message);
            throw new Error(e.message);
        }
    }

    public async getLatestRequest(requestId: number): Promise<functionsRequest> {
        try{
            const provider = await this.provider();
            const funcClientAddress = await this.getFuncClientAddress();
            const funcClient = new ethers.Contract(funcClientAddress, utils.funcClientAbi, provider);
            return await funcClient.getLatestRequest(requestId);
        }catch(e){
            console.log(e.message);
            throw new Error(e.message);
        }
    }

    public async getAllRequest(requestId: number): Promise<Array<functionsRequest>> {
        try{
            const provider = await this.provider();
            const funcClientAddress = await this.getFuncClientAddress();
            const funcClient = new ethers.Contract(funcClientAddress, utils.funcClientAbi, provider);
            return await funcClient.getRequests(requestId);
        }catch(e){
            console.log(e.message);
            throw new Error(e.message);
        }
    }

    public approveSpend(signer: Signer, amount: number, token: string): Promise<Boolean> {
        return new Promise(async (resolve, reject) => {
            try{
                const feeData = await this.getFeeData();
                const payMasterAddress = await this.getPayMasterAddress();
                const payMaster = new ethers.Contract(payMasterAddress, utils.payMaster, signer);
                const getTopupToken: token = await payMaster.getTopUpToken(token);
                const tokenContract = new ethers.Contract(getTopupToken.tokenAddress, utils.erc20Abi, signer);
                //format balance form wei to 10 decimals
                const balance = ethers.utils.formatUnits(await tokenContract.balanceOf(signer.getAddress()), 10);
                if (parseInt(balance) < amount){
                    throw new Error("Insufficient balance");
                }
                const approveTx = await tokenContract.approve(payMasterAddress, amount, feeData);
                const approveTxReceipt = await approveTx.wait();
                if(approveTxReceipt.status == 0){
                    throw new Error("Approve spend failed");
                }
                return true;
            }catch(e){
                console.log(e.message);
                reject(e.message);
            }
        })
    }
}
