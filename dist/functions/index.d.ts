import { Base } from "../base";
import { Signer } from "ethers";
type functions = {
    admin: string;
    caller: string;
    topupToken: string;
    functionId: number;
    status: any;
};
type functionsRequest = {
    requestId: string;
    functionId: number;
    args: Array<string>;
    returnData: string;
    err: string;
    status: boolean;
};
export declare class Functions extends Base {
    registerFunction(signer: Signer, approvedCaller: string, topupToken: string): Promise<number>;
    getRegFunction(id: number): Promise<functions>;
    getAdminFunctions(admin: string): Promise<Array<functions>>;
    toogleFunctionState(signer: Signer, id: number): Promise<string>;
    topup(signer: Signer, amount: number, topupToken: string): Promise<Boolean>;
    adminWithdraw(signer: Signer, token: string): Promise<Boolean>;
    getAdminBalance(admin: string, token: string): Promise<number>;
    makeRequest(signer: Signer, funcId: number, args: Array<string>, source: string, secrets: string): Promise<Object>;
    stopFunction(signer: Signer, funcId: number): Promise<any>;
    getLatestRequest(requestId: number): Promise<functionsRequest>;
    getAllRequest(requestId: number): Promise<Array<functionsRequest>>;
    approveSpend(signer: Signer, amount: number, token: string): Promise<Boolean>;
}
export {};
