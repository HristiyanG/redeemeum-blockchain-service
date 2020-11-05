# Redemeum Frontend Blockchain Service

### Installation
```
npm install redeemeum-blockchain-service --save
```

### Prerequisites
```
You have to have Metamask extension installed on your browser in order this package to work properly.
```

## Description

In order to interact with the Blockchain you would need to set the contract addresses in your `.env` file in the following manner:

``` 
TOKEN_CONTRACT=0x...
VOUCHER_KERNEL_CONTRACT=0x...
CASHIER_CONTRACT=0x...
```

#### Here are all the functions the Service currently provides and some useful information: 

* `async getSigner()` returns JsonRpcSigner
* `async getUserAddress()` -> returns current logged user eth address
* `async signMessage(signer, nonce)` -> returns signature which later will be used by the API service to authenticate the user
* `async requestCreateOrder(contractArgs: Array, value)` -> Broadcast tx to the blockchain. Returns parsed event from the BC transaction
* `async commitToBuy(contractArgs: Array, value)` -> Broadcast tx to the blockchain. Returns parsed event from the BC transaction
* `async refund(voucherID)` -> Broadcast tx to the blockchain. Returns parsed event from the BC transaction
* `async complain(voucherID)` -> Broadcast tx to the blockchain. Returns parsed event from the BC transaction
* `async cancelOrFault(voucherID)` -> Broadcast tx to the blockchain. Returns parsed event from the BC transaction