# One-time note sharing with nullifiers

Share one-time notes on the blockchain with nullifiers


Components:
1. DApp (With a truffel box)
2. Contract
3. Blockchain (Ganache)


## Requirements

1. Node.js and npm
2. Use **nvm** or **n** to fix this [issue](https://docs.npmjs.com/resolving-eacces-permissions-errors-when-installing-packages-globally) when installing globally.  


## Installation

### Install the ganache ethereum local testnet
```sh
# Install ganache
$ npm install -g ganache
```



### Install the truffle
```sh
# Install Truffle globally and run `truffle unbox`
$ npm install -g truffle
```

```sh
# Alternatively, run `truffle unbox` via npx
$ npx truffle unbox react
```

## RUN

To run the ganache/ethereum testnet run in a separate terminal
```sh
$ ganache
```

Compile and deploy the Smart-Contract with
```sh
$ truffle compile
```

Run the DApp with
```sh
$ cd client
$ npm start
```