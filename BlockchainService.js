const ethers = require('ethers');
const Cashier = require('./ABIs/Cashier.json'); 
const TokenContract = require('./ABIs/ERC1155ERC721.json'); 
const VoucherKernel = require('./ABIs/VoucherKernel.json'); 
const { CONTRACT_NAMES } = require('./ContractNames'); 

let instance;

class BlockchainService {

    static getInstance() {
        if (!instance) {
            instance = new BlockchainService();
        }

        return instance;
    }

    constructor() {
        if (window.ethereum) {
            this.provider = new ethers.providers.Web3Provider(web3.currentProvider);
        }

        this.contracts = {
            [CONTRACT_NAMES.CASHIER_CONTRACT]: async () => new ethers.Contract(process.env.CASHIER_CONTRACT, Cashier.abi, await this.getSigner()),
            [CONTRACT_NAMES.TOKEN_CONTRACT]: async () => new ethers.Contract(process.env.TOKEN_CONTRACT, TokenContract.abi, await this.getSigner()),
            [CONTRACT_NAMES.VOUCHER_KERNEL_CONTRACT]: async () => new ethers.Contract(process.env.VOUCHER_KERNEL_CONTRACT, VoucherKernel.abi, await this.getSigner()),
        }
    }

    async getNetworkId() {
        return (await this.provider.getNetwork()).chainId;
    }

    getSigner() {
        return this.provider.getSigner();
    }

    async getUserAddress() {
        return await (this.provider.getSigner()).getAddress();
    }

    async signMessage(signer, nonce) {
        const msg = '\x19Ethereum Signed Message:\n' + nonce
        return await signer.signMessage(ethers.utils.toUtf8Bytes(msg));
    }

    async findEventByName(txReceipt, eventName, ...eventFields) {
        for (const key in txReceipt.events) {
            if (txReceipt.events[key].event == eventName) {
                const event = txReceipt.events[key]

                const resultObj = {
                    txHash: txReceipt.transactionHash
                }

                for (let index = 0; index < eventFields.length; index++) {
                    resultObj[eventFields[index]] = event.args[eventFields[index]].toString();
                }
                return resultObj
            }
        }
    }

    async getContractInstance(contractName) {
        if (!contractName) throw new Error("No Contract Name has been provided")
        return await this.contracts[contractName]()
    }

    async requestCreateOrder(contractArgs, value) {
        const cashierContract = await this.getContractInstance(CONTRACT_NAMES.CASHIER_CONTRACT)
        const tx = await cashierContract.requestCreateOrder(...contractArgs, {
            value
        });

        return await this.processTx(tx, 'LogOrderCreated', '_tokenIdSupply', '_seller', '_promiseId', '_quantity')
    }

    async commitToBuy(contractArgs, value) {
        const cashierContract = await this.getContractInstance(CONTRACT_NAMES.CASHIER_CONTRACT)
        const tx = await cashierContract.requestVoucher(...contractArgs, {
            value
        });

        return await this.processTx(tx, 'LogVoucherDelivered', '_tokenIdSupply', '_tokenIdVoucher', '_issuer', '_holder', '_promiseId');
    }

    async redeem(voucherID) {
        const voucherKernelContract = await this.getContractInstance(CONTRACT_NAMES.VOUCHER_KERNEL_CONTRACT)
        const tx = await voucherKernelContract.redeem(voucherID)

        return await this.processTx(tx, 'LogVoucherRedeemed', '_tokenIdVoucher', '_holder', '_promiseId')
    }

    async refund(voucherID) {
        const voucherKernelContract = await this.getContractInstance(CONTRACT_NAMES.VOUCHER_KERNEL_CONTRACT)
        const tx = await voucherKernelContract.refund(voucherID);

        return await this.processTx(tx, 'LogVoucherRefunded', '_tokenIdVoucher');
    }

    async complain(voucherID) {
        const voucherKernelContract = await this.getContractInstance(CONTRACT_NAMES.VOUCHER_KERNEL_CONTRACT)
        const tx = await voucherKernelContract.complain(voucherID);

        return await this.processTx(tx, 'LogVoucherComplain', '_tokenIdVoucher');
    }

    async cancelOrFault(voucherID) {
        const voucherKernelContract = await this.getContractInstance(CONTRACT_NAMES.VOUCHER_KERNEL_CONTRACT)
        const tx = await voucherKernelContract.cancelOrFault(voucherID);

        return await this.processTx(tx, 'LogVoucherFaultCancel', '_tokenIdVoucher');
    }

    async processTx(tx, eventName, ...args) {
        const txReceipt = await tx.wait();
        return await this.findEventByName(txReceipt, eventName, ...args)
    }

}

export default BlockchainService.getInstance();