# Documentation

https://bankex.github.io/pooling-contract/

# Deployment
#### 1. Create .env file with next content:
```javascript
ETH_KEY=PRIVATE_KEY
INFURA_TOKEN=TOKEN
```
Where `PRIVATE KEY` (without `0x`) is ethereum private key, from which contract will be deploy.                           
And `TOKEN` is a unique string that gives access to send a transaction to rinkeby testnet.             
You may get this `TOKEN` after [registration](https://infura.io/).        

#### 2. Use `truffle migrate --network rinkeby` to  deploy contract on rinkeby testnet.
---
Strictly recommended to use solium linter. `solium -d contracts`

If you have compilation errors due to `emit Event` in solidity, update truffle.
