type config = {
    rpcUrl: string;
    funcClientAddress: string;
    funcRegAddress: string;
    payMasterAddress: string;
};
export declare abstract class Base {
    private rpcUrl;
    private funcClientAddress;
    private funcRegAddress;
    private payMasterAddress;
    constructor(config: config);
    protected provider(): Promise<any>;
    protected getFuncClientAddress(): Promise<string>;
    protected getFuncRegAddress(): Promise<string>;
    protected getPayMasterAddress(): Promise<string>;
    protected getFeeData(): Promise<any>;
}
export {};
