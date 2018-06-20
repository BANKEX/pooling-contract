# Pooling Smart Contract 

## About

This is a developer guide. This guide will explain how to work with *pooling* and describe all it's states, roles and models.

## What is pooling?
___

Pooling helps to collect a big sum of Ethereum from investors. Sometimes it's impossible to invest in ICO because it's not public and ICO creators are not interested in your small sum.

But if you definitely want to invest you can find a group of investors like you and collect a big sum of money which will be interesting for ICO creators.

So, with pooling contract you can easily collect money and invest it to ICO. If something went wrong pooling will refund money back. Moreover, pooling contract allows you to collect ETH even before the token creation.

## How it works (part 1: Roles)
___

In pooling contract there are **stakeholders** and **investors**.

Stakeholders:

1. ADMIN (RL\_ADMIN) - BANKEX manager who will create the contract
2. Pool manager (RL\_POOL\_MANAGER) - a person who will find investors and ICO to invest
3. ICO manager (RL\_ICO\_MANAGER) - a person who who tokens of target ICO and will sell tokens for ETH
4. Paybot (RL\_PAYBOT) - it's another account of ADMIN with some restrictions controlled by code 

All investors have Default role (RL\_DEFAULT)

## How it works (part 2: States)
___

#### Pooling contract have different states. Description: 

1. ST\_DEFAULT - Admin just created pooling contract 
2. ST\_RAISING - investors send ETH to pooling contract, only pool manager can start raising
3. ST\_WAIT\_FOR\_ICO - target sum is collected and everybody are waiting for tokens from ICO manager
4. ST\_MONEY\_BACK (**if something went wrong**) - all collected sum is returned back to investors 
5. ST\_TOKEN\_DISTRIBUTION - investors can get their tokens from contract and return some shortages of Ethereum if ICO manager did not get all the collected sum
6. ST\_FUND\_DEPRICATED - pooling contract death (occurred after amount of time called DISTRIBUTION\_PERIOD)

#### Fund and time states:
Every common state (*ST\_DEFAULT, ST\_RAISING,ST\_WAIT\_FOR\_ICO and e.t.c*) are linked with other states (*Time and Fund states*). 
**For example:** ST\_WAIT\_FOR\_ICO can be occured **only** if fund state is **RST\_COLLECTED**

##### Fund states:
*There are **minimal** and **maximal** size of fund int ETH*
1. RST\_NOT\_COLLECTED - if sum of ETH on contract is **less** than **minimal** fund size --- **(SUM < MINIMAL)**
2. RST\_COLLECTED - if sum of ETH on contract is **less** than **maximal** fund size **but** is more than **minimal** fund size --- **( MINIMAL < SUM < MAXIMAL )**
3. RST\_FULL - if fum of ETH on contract is is more than **maximal** fund size --- **(SUM > MAXIMAL)**

##### Time states:
*There are some periods, connected with time state (**raisingPeriod**, **icoPeriod**, **distributionPeriod**)*
1. TST\_DEFAULT - when admin only created pooling contract
2. TST\_RAISING - when pool manager start rasing money for ICO during **raisingPeriod**
3. TST\_WAIT_FOR_ICO - when **raisingPeriod** ends. This state continues during **icoPeriod**
4. TST\_TOKEN\_DISTRIBUTION - when **icoPeriod** ends. This state continues during **distributionPeriod**
5. TST\_FUND\_DEPRECATED - when **distributionPeriod** ends

#### Examples:

##### Example of lifecycle with states:
1. Pool manager finds ICO manager and investors and make an agreement (*minimal sum for ICO participation*, *amount of time to collected that sum*, percent for ICO manager and pool manager)
2. Admin create a pooling smart contract when pool manager asked him about it (*with all paramters in* **1.**) --- **ST\_DEFAULT**
3. Pool manager starts raising state and all investors send Ethereum to pooling contract --- **ST\_RAISING**
4. Minimal sum is collected and **raisingPeriod** ends, **ICO\_MANAGER** can get ETH from pooling and send to it ERC20 tokens --- **ST\_WAIT_FOR_ICO**
5. **ICO\_MANAGER** send tokens to contract, investors can get their tokens from contract --- **ST\_TOKEN\_DISTRIBUTION**
6. Token **distributionPeriod** ends and pooling contract is not working anymore. Only **Admin** can work with it. --- **ST\_FUND\_DEPRICATED**

##### Example of lifecycle with states (ST\_MONEY\_BACK case):
1. Pool manager finds ICO manager and investors and make an agreement (*minimal sum for ICO participation*, *amount of time to collected that sum*, percent for ICO manager and pool manager)
2. Admin create a pooling smart contract when pool manager asked him about it (*with all paramters in* **1.**) --- **ST\_DEFAULT**
3. Pool manager starts raising state and all investors send Ethereum to pooling contract --- **ST\_RAISING**
4. Minimal sum **is not collected** and **raisingPeriod** ends --- **ST\_MONEY\_BACK**
5. Investors get their Ethereum back from contract 
6. After **distributionPeriod** ends and pooling contract is not working anymore. Only **Admin** can work with it. --- **ST\_FUND\_DEPRICATED**

#### Visualiation of states:

## How it works (part 3: Shares)
___
Every stakeholder have it's own share from all invested sum
1. ADMIN - have 1% of all invested sum
2. Pool manager - have 4% of all invested sum
3. ICO manager have 95% of all invested sum

##### Calculation of stakeholders sum:
There arent float varibles in Solidity, so we are using DECIMAL\_MULTIPLIER == 10 ** 18
To calculate part of stake holder we need: 
**Stakeholder percent** \* **total invested sum** \--- **sum that stake holder get back earlier**

But in *Solidity* it looks like:
**total invested sum** \* (**Stakeholder percent** / **DECIMAL\_MULTIPLIER**) \--- **sum that stake holder get back earlier**
Where **Stakeholder percent**  =  % \* **DECIMAL\_MULTIPLIER**

##### Calculation of investors tokens sum:
To release tokens to investor in proportion to it's invested sum of Ethereum we need:
**All amount of tokens** \* (**Investor sum** / **total invested sum**) \--- **sum that investor get back earlier**
Amount of tokens and other variables here a multiplied by **DECIMAL\_MULTIPLIER**, so float problem is solved

##### Calculation of investors ethereum sum after ico manager release it's share:
Firstly, we need to get stakeholders part:
**Stakeholders part** = **Sum that ICO manager released earlier** \* **DECIMAL\_MULTIPLIER** / **ICO manager part in percents**
Secondly, we need to get ETH sum **minus** Stakeholders part:
**Allowed sum** = **All invested sum** - **Stakeholders part**
Thirdly, we get sum for investor:
**Allowed sum** \* **Invested sum of current investor** / **All invested sum** \--- **amount of ETH that investor released earlier**

##### Calculation of investors ethereum sum in MONEY_BACK case:
We just need to substract amount that investor want to get back from all amount that investor sent before:
**Invested sum of current investor** \--- **Sum that investor want to get back**

## How it works (part 4: Ethereum and tokens)
___

1. When pool state is **ST\_DEFAULT** there aren't any ETH or Tokens on contract
2. When pool state is **ST\_RAISING** pooling has all ETH that investors sent
3. When pool state is **ST\_WAIT\_FOR\_ICO** pooling contract allow ICO manager, Pool manager and Admin to release their ETH parts. ICO manager sent tokens to pooling contract
4. If pool state is **ST\_MONEY\_BACK** pooling contract allow investors to get all their ETH back 
4. When pool state is **ST\_TOKEN\_DISTRIBUTION** pooling contract allow investors to release tokens and part of Ethereum that wasn't taken by stakeholders 
5. When pool state is **ST\_FUND\_DEPRICATED** pooling contract have all tokens and ETH that were not taken by investors and stakeholders. Only admin can release it.

#### Visualiation of cashflow:

![Image of cashflow](https://drive.google.com/file/d/1vj_f-HpQa1MLOLZLwz4uGM5VFMQgdu45/view?usp=sharing)

## Using
___

 You can find examples at: test/PoolTest.js
 
##### Some small examples:
Function **setState()** - change state of pooling 
 ```javascript 
const tbn = v => web3.toBigNumber(v);
const POOL_MANAGER = accounts[1];
const ST_RAISING = tbn(0x01);
... creation pool instance
async () => {
    await pool.setState(ST_RAISING, {from: POOL_MANAGER});
}
```
Function **getStakeholderBalanceOf()** is a **.call()** function that returns amount of ETH in **WEI** that current stakeholder can release
 ```javascript 
const POOL_MANAGER = accounts[1];
... creation pool instance
async () => {
    await pool.getStakeholderBalanceOf(RL_ICO_MANAGER);
}
```

## Deployment
___
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