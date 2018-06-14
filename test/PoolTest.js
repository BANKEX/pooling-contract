const Pool = artifacts.require("./PoolTest.sol");
const Token = artifacts.require("./TestToken.sol");

const web3 = global.web3;

const IERC20_ABI = [
    {
        "constant": false,
        "inputs": [
            {
                "name": "spender",
                "type": "address"
            },
            {
                "name": "value",
                "type": "uint256"
            }
        ],
        "name": "approve",
        "outputs": [
            {
                "name": "",
                "type": "bool"
            }
        ],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "constant": true,
        "inputs": [],
        "name": "totalSupply",
        "outputs": [
            {
                "name": "",
                "type": "uint256"
            }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
    },
    {
        "constant": false,
        "inputs": [
            {
                "name": "from",
                "type": "address"
            },
            {
                "name": "to",
                "type": "address"
            },
            {
                "name": "value",
                "type": "uint256"
            }
        ],
        "name": "transferFrom",
        "outputs": [
            {
                "name": "",
                "type": "bool"
            }
        ],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "constant": true,
        "inputs": [
            {
                "name": "who",
                "type": "address"
            }
        ],
        "name": "balanceOf",
        "outputs": [
            {
                "name": "",
                "type": "uint256"
            }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
    },
    {
        "constant": false,
        "inputs": [
            {
                "name": "to",
                "type": "address"
            },
            {
                "name": "value",
                "type": "uint256"
            }
        ],
        "name": "transfer",
        "outputs": [
            {
                "name": "",
                "type": "bool"
            }
        ],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "constant": true,
        "inputs": [
            {
                "name": "owner",
                "type": "address"
            },
            {
                "name": "spender",
                "type": "address"
            }
        ],
        "name": "allowance",
        "outputs": [
            {
                "name": "",
                "type": "uint256"
            }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
    }
];

const tbn = v => web3.toBigNumber(v);
const fbn = v => v.toString();
const tw = v => web3.toBigNumber(v).mul(1e18);
const fw = v => web3._extend.utils.fromWei(v).toString();

const TOKEN_SUPPLY = tw(10);
const MINIMAL_DEPOSIT_SIZE = tw(0.05);
const TI_DAY = tbn(864000000);

const ST_DEFAULT = tbn(0x00);
const ST_RAISING = tbn(0x01);
const ST_WAIT_FOR_ICO = tbn(0x02);
const ST_MONEY_BACK = tbn(0x04);
const ST_TOKEN_DISTRIBUTION = tbn(0x08);
const ST_FUND_DEPRECATED = tbn(0x10);

const ADMIN_SHARE = tbn(1e16);
const POOL_MANAGER_SHARE = tbn(4e16);

const TM_DEFAULT = tbn(0x00);
const TM_RAISING = tbn(0x01);
const TM_WAIT_FOR_ICO = tbn(0x02);
const TM_TOKEN_DISTRIBUTION = tbn(0x08);
const TM_FUND_DEPRECATED = tbn(0x10);

const RAISING_PERIOD = TI_DAY.mul(10);
const ICO_PERIOD = TI_DAY.mul(15);
const DISTRIBUTION_PERIOD = TI_DAY.mul(45);

const MINIMAL_FUND_SIZE = tw(1);
const MAXIMAL_FUND_SIZE = tw(100000);

const INVESTOR_SUM_PAY = tw(0.5);
const ICO_MANAGER_RELEASE_ETH = tw(2);
const INVESTOR_SUM_TO_TRIGGER = tw(0.00001);

const RL_DEFAULT = tbn(0x00);
const RL_POOL_MANAGER = tbn(0x01);
const RL_ICO_MANAGER = tbn(0x02);
const RL_ADMIN = tbn(0x04);
const RL_PAYBOT = tbn(0x08);

const gasPrice = tw("3e-7");

contract('Pool Common test', (accounts) => {

    const ADMIN = accounts[0];
    const POOL_MANAGER = accounts[1];
    const PAYBOT = accounts[2];
    const ICO_MANAGER = accounts[3];

    const investors = {
        account4: accounts[4],
        account5: accounts[5],
        account6: accounts[6],
        account7: accounts[7],
        account8: accounts[8]
    };

    let pool;
    let token;

    const resetBeforeTest = async () => {
        token = await Token.new(
            TOKEN_SUPPLY, {
                from: ICO_MANAGER
            }
        );
        pool = await Pool.new(
            RAISING_PERIOD, ICO_PERIOD, DISTRIBUTION_PERIOD,
            MINIMAL_FUND_SIZE, MAXIMAL_FUND_SIZE, MINIMAL_DEPOSIT_SIZE,
            ADMIN_SHARE, POOL_MANAGER_SHARE,
            POOL_MANAGER, ICO_MANAGER, PAYBOT,
            token.address, {
                from: ADMIN
            }
        );
    };

    beforeEach(resetBeforeTest);

    describe('Role Tests', () => {
        it('check that ADMIN account has role RL_ADMIN', async () => {
            assert((await pool.getRole(ADMIN)).eq(RL_ADMIN),"admin role error");
        });
        it('check that ICO_MANAGER account has role RL_ICO_MANAGER', async () => {
            assert((await pool.getRole(ICO_MANAGER)).eq(RL_ICO_MANAGER),"ico manager role error");
        });
        it('check that PAY_BOT account has role RL_PAYBOT', async () => {
            assert((await pool.getRole(PAYBOT)).eq(RL_PAYBOT),"pay bot role error");
        });
        it('check that POOL_MANAGER account has role RL_POOL_MANAGER', async () => {
            assert((await pool.getRole(POOL_MANAGER)).eq(RL_POOL_MANAGER),"pool manager role error");
        });
    });

    describe('Store Tests', () => {
        it('should send ETH via sendTransaction and get total sent ETH', async () => {
            let totalETH = tbn(0);
            // Set raising state in order to investors could send ETH to pooling contract
            await pool.setState(ST_RAISING, {from: POOL_MANAGER});
            // Here investors are sending INVESTOR_SUM_PAY amount of ETH to pooling contract
            for (let i in investors) {
                await pool.sendTransaction({value: INVESTOR_SUM_PAY,from: investors[i]});
                totalETH = totalETH.plus(INVESTOR_SUM_PAY);
            }
            // Get total sending ETH to pooling contract
            let totalSentETH = await pool.totalShare();
            // True if total sending amount of ETH to pooling contract equals to variable which accumulate total amount of ETH
            assert(totalETH.eq(totalSentETH));
        });
        it('should send ETH via buyShare func and get total sent ETH', async () => {
            let totalETH = tbn(0);
            await pool.setState(ST_RAISING, {from: POOL_MANAGER});
            // Here investors are sending INVESTOR_SUM_PAY amount of ETH to payable func buyShare to pooling contract
            for (let i in investors) {
                await pool.buyShare({value: INVESTOR_SUM_PAY,from: investors[i]});
                totalETH = totalETH.plus(INVESTOR_SUM_PAY);
            }
            // Get total sending ETH to pooling contract
            let totalSentETH = await pool.totalShare();
            // True if total sending amount of ETH to pooling contract equals to variable which accumulate total amount of ETH on pooling contract
            assert(totalSentETH.eq(totalETH));
        });
        it('should get stakeholder balance', async () => {
            await pool.setState(ST_RAISING, {from: POOL_MANAGER});
            for (let i in investors)
                await pool.sendTransaction({value: INVESTOR_SUM_PAY,from: investors[i]});
            let totalSentETH = await pool.totalShare();
            await pool.setState(ST_WAIT_FOR_ICO, {from: ICO_MANAGER});
            // allowedBalance variable will contain ICO manager share in ETH 
            let allowedBalance = await pool.getStakeholderBalanceOf(RL_ICO_MANAGER);
            // (Percent share of ICO manager from total sent ETH) multiplyed by DECIMAL_MULTIPLIER (1e18) 
            let icoManagerPersentageShare = await pool.stakeholderShare(2);
            // Calculate icoManagerETHShare.
            let icoManagerETHShare = totalSentETH.mul(icoManagerPersentageShare).divToInt(1e18);
            // True if contract balance in ETH of ICO manager equals to calculated ETH share of ico manager
            assert(allowedBalance.eq(icoManagerETHShare));
        });
        it('should release ether to stakeholder by ico manager', async () => {
            await pool.setState(ST_RAISING, {from: POOL_MANAGER});
            for (let i in investors)
                await pool.sendTransaction({value: INVESTOR_SUM_PAY,from: investors[i]});
            await pool.setState(ST_WAIT_FOR_ICO, {from: ICO_MANAGER});
            let balanceBefore = await web3.eth.getBalance(ICO_MANAGER);
            let allowedBalance = await pool.getStakeholderBalanceOf(RL_ICO_MANAGER);
            // ICO manager calls func that will send all allowed amount of ETH for ICO manager to ICO manager
            let tx = await pool.releaseEtherToStakeholder(allowedBalance, {from: ICO_MANAGER, gasPrice: gasPrice});
            // Calculate tx gas cost
            let gasCost = gasPrice.mul(tx.receipt.gasUsed);
            let balanceAfter = await web3.eth.getBalance(ICO_MANAGER);
            // True if balance after release ETH to ICO manger equals to balance before plus ICO manager share minus gas cost 
            assert(balanceAfter.eq((balanceBefore.plus(allowedBalance)).minus(gasCost)));
        });
        it('should release ether to stakeholder by admin', async () => {
            await pool.setState(ST_RAISING, {from: POOL_MANAGER});
            for (let i in investors)
                await pool.sendTransaction({value: INVESTOR_SUM_PAY,from: investors[i]});
            await pool.setState(ST_WAIT_FOR_ICO, {from: ICO_MANAGER});
            let balanceBefore = await web3.eth.getBalance(ICO_MANAGER);
            // Admin calls func that will send all allowed amount of ETH for ICO manager to ICO manager
            await pool.releaseEtherToStakeholderForce(RL_ICO_MANAGER, ICO_MANAGER_RELEASE_ETH, {from: ADMIN, gasPrice: gasPrice});
            let balanceAfter = await web3.eth.getBalance(ICO_MANAGER);
             // True if balance after release ETH to ICO manger equals to balance before plus ICO manager share
            assert(balanceAfter.eq((balanceBefore.plus(ICO_MANAGER_RELEASE_ETH))));
        });

        it('should approve and accept tokens from ICO', async () => {
            await pool.setState(ST_RAISING, {from: POOL_MANAGER});
            for (let i in investors)
                await pool.sendTransaction({value: INVESTOR_SUM_PAY,from: investors[i]});
            await pool.setState(ST_WAIT_FOR_ICO, {from: ICO_MANAGER});
            let allowedBalance = await pool.getStakeholderBalanceOf(RL_ICO_MANAGER);
            let tx = await pool.releaseEtherToStakeholder(allowedBalance, {from: ICO_MANAGER,gasPrice: gasPrice});
            // ICO manager gives allowance to pooling contract address to use TOKEN_SUPPLY amount of tokens from ICO contract 
            await token.approve(pool.address, TOKEN_SUPPLY, {from: ICO_MANAGER});
            // Check this allowance on ICO contract
            let allowedTokens = await token.allowance(ICO_MANAGER, pool.address);
            // True if allowed amount of tokens equals to approved value
            assert(allowedTokens.eq(TOKEN_SUPPLY));
            // ICO manager calls func that transfer allowed amount of tokens to pooling contract
            await pool.acceptTokenFromICO(allowedTokens, {from: ICO_MANAGER});
            // Checks pooling contract balance on ICO contract
            let contractBalance = await token.balanceOf(pool.address);
            // True if pooling contract balance equals to accepted tokens from ICO
            assert(contractBalance.eq(TOKEN_SUPPLY));
        });
        it('should allow to release tokens to investors', async () => {
            await pool.setState(ST_RAISING, {from: POOL_MANAGER});
            for (let i in investors)
                await pool.sendTransaction({value: INVESTOR_SUM_PAY,from: investors[i]});
            let totalSentETH = await pool.totalShare();
            await pool.setState(ST_WAIT_FOR_ICO, {from: ICO_MANAGER});
            let allowedBalance = await pool.getStakeholderBalanceOf(RL_ICO_MANAGER);
            let tx = await pool.releaseEtherToStakeholder(allowedBalance, {from: ICO_MANAGER,gasPrice: gasPrice});
            await token.approve(pool.address, TOKEN_SUPPLY, {from: ICO_MANAGER});
            await pool.acceptTokenFromICO(TOKEN_SUPPLY, {from: ICO_MANAGER});
            //  Set token distribution state in order to investors could release their share of tokens and share of remaining ETH 
            await pool.setState(ST_TOKEN_DISTRIBUTION, {from: ADMIN});
            // Each investor gets his share of tokens
            for (let i in investors) {
                // Get amount of tokens that investor can get
                let poolingTokenBalance = await pool.getBalanceTokenOf(investors[i]);
                // True if amount of tokens that investor can get equals to sum, which investor paid, 
                // divided by total sending amount of ETH (this is investor share)
                // and multiplied by total allowed amount of tokens
                assert(poolingTokenBalance.eq(INVESTOR_SUM_PAY.mul(TOKEN_SUPPLY).div(totalSentETH)));
                // Investor calls func that transfer investor's share of tokens to investor
                await pool.releaseToken(poolingTokenBalance, {from: investors[i],gasPrice: gasPrice});
                // Checking investor's token balance
                let erc20TokenBalance = await token.balanceOf(investors[i]);
                // True if amount of tokens that investor could get equals to current investor's token balance
                assert(poolingTokenBalance.eq(erc20TokenBalance));
            }
        });
        it('should allow to release tokens to investors via releaseTokenForce', async () => {
            await pool.setState(ST_RAISING, {from: POOL_MANAGER});
            for (let i in investors)
                await pool.sendTransaction({value: INVESTOR_SUM_PAY,from: investors[i]});
            let totalSentETH = await pool.totalShare();
            await pool.setState(ST_WAIT_FOR_ICO, {from: ICO_MANAGER});
            let allowedBalance = await pool.getStakeholderBalanceOf(RL_ICO_MANAGER);
            let tx = await pool.releaseEtherToStakeholder(allowedBalance, {from: ICO_MANAGER,gasPrice: gasPrice});
            await token.approve(pool.address, TOKEN_SUPPLY, {from: ICO_MANAGER});
            await pool.acceptTokenFromICO(TOKEN_SUPPLY, {from: ICO_MANAGER});
            //  Set token distribution state in order to investors could release their share of tokens and share of remaining ETH 
            await pool.setState(ST_TOKEN_DISTRIBUTION, {from: ADMIN});
            // Each investor gets his share of remaining tokens
            for (let i in investors) {
                // Get amount of tokens that investor can get
                let poolingTokenBalance = await pool.getBalanceTokenOf(investors[i]);
                // True if amount of tokens that investor can get equals to sum, which investor paid, 
                // divided by total sending amount of ETH (this is investor share)
                // and multiplied by total allowed amount of tokens
                assert(poolingTokenBalance.eq(INVESTOR_SUM_PAY.mul(TOKEN_SUPPLY).div(totalSentETH)));
                // Investor calls func that transfer to investor his share of tokens
                await pool.releaseTokenForce(investors[i], poolingTokenBalance, {from: ADMIN ,gasPrice: gasPrice});
                // Checking investor's token balance
                let erc20TokenBalance = await token.balanceOf(investors[i]);
                // True if amount of tokens that investor could get equals to current investor's token balance
                assert(poolingTokenBalance.eq(erc20TokenBalance));
            }
        });
        it('should allow to release remaining ETH to investors', async () => {
            await pool.setState(ST_RAISING, {from: POOL_MANAGER});
            for (let i in investors)
                await pool.sendTransaction({value: INVESTOR_SUM_PAY,from: investors[i]});
            let totalSentETH = await pool.totalShare();
            await pool.setState(ST_WAIT_FOR_ICO, {from: ICO_MANAGER});
            let allowedBalance = await pool.getStakeholderBalanceOf(RL_ICO_MANAGER);
            let tx = await pool.releaseEtherToStakeholder(ICO_MANAGER_RELEASE_ETH, {from: ICO_MANAGER,gasPrice: gasPrice});
            await token.approve(pool.address, TOKEN_SUPPLY, {from: ICO_MANAGER});
            await pool.acceptTokenFromICO(TOKEN_SUPPLY, {from: ICO_MANAGER});
            await pool.setState(ST_TOKEN_DISTRIBUTION, {from: ADMIN});
            // Each investor gets his share of remaining ETH
            for (let i in investors) {
                // Get amount of ETH that investor can get
                let poolingETHBalance = await pool.getBalanceEtherOf(investors[i]);
                // Investor's balance before release ETH
                let investorBalanceBefore = await web3.eth.getBalance(investors[i]);
                // Investor calls func that transfer to investor his share of remaining ETH
                let tx = await pool.releaseEther(poolingETHBalance, {from: investors[i], gasPrice: gasPrice});
                // Calculate tx gas cost
                let gasCost = gasPrice.mul(tx.receipt.gasUsed);
                // Investor's balance after release ETH
                let investorBalanceAfter = await web3.eth.getBalance(investors[i]);
                // True if investor's balance after release of ETH equals to balance before plus released amount of ETH minus gas cost
                assert(investorBalanceAfter.eq(investorBalanceBefore.plus(poolingETHBalance).minus(gasCost)));
            }
        });
        it('should allow to release remaining ETH to investors via releaseEtherForce', async () => {
            await pool.setState(ST_RAISING, {from: POOL_MANAGER});
            for (let i in investors)
                await pool.sendTransaction({value: INVESTOR_SUM_PAY,from: investors[i]});
            let totalSentETH = await pool.totalShare();
            await pool.setState(ST_WAIT_FOR_ICO, {from: ICO_MANAGER});
            let allowedBalance = await pool.getStakeholderBalanceOf(RL_ICO_MANAGER);
            let tx = await pool.releaseEtherToStakeholder(ICO_MANAGER_RELEASE_ETH, {from: ICO_MANAGER,gasPrice: gasPrice});
            await token.approve(pool.address, TOKEN_SUPPLY, {from: ICO_MANAGER});
            await pool.acceptTokenFromICO(TOKEN_SUPPLY, {from: ICO_MANAGER});
            await pool.setState(ST_TOKEN_DISTRIBUTION, {from: ADMIN});
            // Each investor gets his share of remaining ETH
            for (let i in investors) {
                // Get amount of ETH that investor can get
                let poolingETHBalance = await pool.getBalanceEtherOf(investors[i]);
                // Investor's balance before release ETH
                let investorBalanceBefore = await web3.eth.getBalance(investors[i]);
                // Admin calls func that transfer to investor his share of remaining ETH
                await pool.releaseEtherForce(investors[i], poolingETHBalance, {from: ADMIN, gasPrice: gasPrice});
                // Investor's balance after release ETH
                let investorBalanceAfter = await web3.eth.getBalance(investors[i]);
                // True if investor's balance after release of ETH equals to balance before plus released amount
                assert(investorBalanceAfter.eq(investorBalanceBefore.plus(poolingETHBalance)));
            }
        });
        it('should allow to release ETH and Tokens by transaction sending', async () => {
            await pool.setState(ST_RAISING, {from: POOL_MANAGER});
            for (let i in investors)
                await pool.sendTransaction({value: INVESTOR_SUM_PAY,from: investors[i]});
            let totalSentETH = await pool.totalShare();
            await pool.setState(ST_WAIT_FOR_ICO, {from: ICO_MANAGER});
            let allowedBalance = await pool.getStakeholderBalanceOf(RL_ICO_MANAGER);
            let tx = await pool.releaseEtherToStakeholder(ICO_MANAGER_RELEASE_ETH, {from: ICO_MANAGER,gasPrice: gasPrice});
            let gasCost = gasPrice.mul(tx.receipt.gasUsed);
            await token.approve(pool.address, TOKEN_SUPPLY, {from: ICO_MANAGER});
            await pool.acceptTokenFromICO(TOKEN_SUPPLY, {from: ICO_MANAGER});
            await pool.setState(ST_TOKEN_DISTRIBUTION, {from: ADMIN});
            // Each investor gets his share of remaining ETH and share of tokens via transaction send
            for (let i in investors) {
                // Get amount of ETH that investor can get
                let poolingETHBalance = await pool.getBalanceEtherOf(investors[i]);
                // Get amount of tokens that investor can get
                let poolingTokenBalance = await pool.getBalanceTokenOf(investors[i]);
                // True if amount of tokens that investor can get equals to sum, which investor paid, 
                // divided by total sending amount of ETH (this is investor share)
                // and multiplied by total allowed amount of tokens
                assert(poolingTokenBalance.eq(INVESTOR_SUM_PAY.mul(TOKEN_SUPPLY).div(totalSentETH)));
                // Investor's balance before release ETH
                let investorBalanceBefore = await web3.eth.getBalance(investors[i]);
                // Investor sends transaction with any amount of ETH (this value will return to investor).
                // After that he gets his share of remaining ETH and share of tokens
                let tx = await pool.sendTransaction({from: investors[i], value: tbn(1e7), gasPrice: gasPrice});
                // Calculate tx gas cost
                let gasCost = gasPrice.mul(tx.receipt.gasUsed);
                 // Investor's balance after release ETH
                let investorBalanceAfter = await web3.eth.getBalance(investors[i]);
                // True if investor's balance after release of ETH equals to balance before plus released amount
                assert(investorBalanceAfter.eq(investorBalanceBefore.plus(poolingETHBalance).minus(gasCost)));
                // Checking investor's token balance
                let erc20TokenBalance = await token.balanceOf(investors[i]);
                // True if amount of tokens that investor could get equals to current investor's token balance
                assert(poolingTokenBalance.eq(erc20TokenBalance));
            }
        });
        it('should allow to make money back via sendTransaction ', async () => {
            let sendValue = tw(0.06);
            await pool.setState(ST_RAISING, {from: POOL_MANAGER});
            for (let i in investors)
                await pool.sendTransaction({value: sendValue, from: investors[i]});
            // Set money back state in order to investors could send back their ETH because the minimum amount was not collected 
            await pool.setState(ST_MONEY_BACK, {from: ADMIN});
            // Investors take back their amount of sending ETH 
            for (let i in investors) {
                // Investor's balance before money back
                let balanceBefore = await web3.eth.getBalance(investors[i]);
                // Investor sends transaction with any amount of ETH (this value will return to investor).
                // After that he get his money back
                let tx = await pool.sendTransaction({value: tw(0.000001), from: investors[i], gasPrice: gasPrice});
                let gasCost = gasPrice.mul(tx.receipt.gasUsed);
                // Investor's balance after money back
                let balanceAfter = await web3.eth.getBalance(investors[i]);
                // True if investor's balance after money back equals to balance before plus send value to pooling contract minus gas cost
                assert(balanceAfter.eq(balanceBefore.plus(sendValue).minus(gasCost)));
            }    
        });
        it('should allow to make money back via refundShare func', async () => {
            let sendValue = tw(0.06);
            await pool.setState(ST_RAISING, {from: POOL_MANAGER});
            for (let i in investors)
                await pool.sendTransaction({value: sendValue, from: investors[i]});
            // Set money back state in order to investors could send back their ETH because the minimum amount was not collected 
            await pool.setState(ST_MONEY_BACK, {from: ADMIN});
            // Investors take back their amount of sending ETH
            for (let i in investors) {
                // Investor's balance before money back
                let balanceBefore = await web3.eth.getBalance(investors[i]);
                // Investor calls payable func with any amount of ETH (this value will return to investor).
                // After that he get his money back
                let tx = await pool.refundShare(sendValue,{from: investors[i], gasPrice: gasPrice});
                let gasCost = gasPrice.mul(tx.receipt.gasUsed);
                // Investor's balance after money back
                let balanceAfter = await web3.eth.getBalance(investors[i]);
                // True if investor's balance after money back equals to balance before plus send value to pooling contract minus gas cost
                assert(balanceAfter.eq(balanceBefore.plus(sendValue).minus(gasCost)));
            }    
        });
        it('should allow to make money back via refundShareForce function', async () => {
            let sendValue = tw(0.06);
            await pool.setState(ST_RAISING, {from: POOL_MANAGER});
            for (let i in investors)
                await pool.sendTransaction({value: sendValue, from: investors[i]});
            // Set money back state in order to investors could send back their ETH because the minimum amount was not collected 
            await pool.setState(ST_MONEY_BACK, {from: ADMIN});
            // Investors take back their amount of sending ETH
            for (let i in investors) {
                // Investor's balance before money back
                let balanceBefore = await web3.eth.getBalance(investors[i]);
                // Admin calls payable func with any amount of ETH (this value will return to him).
                // After that investor gets his money back
                let tx = await pool.refundShareForce(investors[i], sendValue, {from: ADMIN, gasPrice: gasPrice});
                // Investor's balance after money back
                let balanceAfter = await web3.eth.getBalance(investors[i]);
                // True if investor's balance after money back equals to balance before plus send value to pooling
                assert(balanceAfter.eq(balanceBefore.plus(sendValue)));
            }    
        });
        it('should allow to return ETH to admin after money back', async () => {
            let sendValue = tw(0.06);
            await pool.setState(ST_RAISING, {from: POOL_MANAGER});
            for (let i in investors)
                await pool.sendTransaction({value: sendValue, from: investors[i]});
            // Set money back state in order to investors could send back their ETH because the minimum amount was not collected 
            await pool.setState(ST_MONEY_BACK, {from: ADMIN});
            // Investor calls payable func with any amount of ETH (this value will return to investor).
            // After that he get his money back
            let tx = await pool.refundShare(sendValue,{from: investors['account4'], gasPrice: gasPrice});
            // add DISTRIBUTION_PERIOD to time state
            await pool.incTimestamp(DISTRIBUTION_PERIOD);
            // balance of ADMIN in ETH before
            let balanceBeforeAdmin = await web3.eth.getBalance(ADMIN);
            // balance of pooling contract in ETH
            let poolContractBalance = await web3.eth.getBalance(pool.address);
            // transfer ETH to admin from pooling contract by admin
            let depricaction_tx = await pool.execute(ADMIN, poolContractBalance, 0, {from: ADMIN, gasPrice: gasPrice});
            // tx cost
            let gasCost = gasPrice.mul(depricaction_tx.receipt.gasUsed);
            // balance after of admin in ETH
            let balanceAfterAdmin = await web3.eth.getBalance(ADMIN);
            // check that admin return this amount of ETH correctly
            assert(balanceAfterAdmin.eq(balanceBeforeAdmin.plus(poolContractBalance).minus(gasCost)));
        });
    });
    describe('State Tests', () => {
        it('should check default state', async () => {
            // Getting current state
            let state = await pool.getState();
            // Check that current state == ST_DEFAULT
            assert(state.eq(ST_DEFAULT));
        });
        it('should set raising state', async () => {
            // set RAISING state by Pool manager account
            await pool.setState(ST_RAISING, {from: POOL_MANAGER});
            // Getting current state
            let state = await pool.getState();
            // Check that current state == ST_RAISING
            assert(state.eq(ST_RAISING));
        });
        it('should set wait for ICO state', async () => {
            // set RAISING state by Pool manager account
            await pool.setState(ST_RAISING, {from: POOL_MANAGER});
            // all investors send sum to pooling contract during raising
            for (let i in investors)
                await pool.sendTransaction({value: INVESTOR_SUM_PAY, from: investors[i]});
            // set WAIT_FOR_ICO state by ICO manager account
            await pool.setState(ST_WAIT_FOR_ICO, {from: ICO_MANAGER});
            // Getting current state
            let state = await pool.getState();
            // Check that current state == ST_WAIT_FOR_ICO
            assert(state.eq(ST_WAIT_FOR_ICO));
        });
        it('should set token distribution state', async () => {
            // set RAISING state by Pool manager account
            await pool.setState(ST_RAISING, {from: POOL_MANAGER});
            // all investors send sum to pooling contract during raising
            for (let i in investors)
                await pool.sendTransaction({value: INVESTOR_SUM_PAY, from: investors[i]});
            // set WAIT_FOR_ICO state by ICO manager account
            await pool.setState(ST_WAIT_FOR_ICO, {from: ICO_MANAGER});
            // set ST_TOKEN_DISTRIBUTION state by ICO manager account
            await pool.setState(ST_TOKEN_DISTRIBUTION, {from: ICO_MANAGER});
            // Getting current state
            let state = await pool.getState();
            // Check that current state == ST_TOKEN_DISTRIBUTION
            assert(state.eq(ST_TOKEN_DISTRIBUTION));
        });
        it('should set money back state', async () => {
            // set RAISING state by Pool manager account
            await pool.setState(ST_RAISING, {from: POOL_MANAGER});
            // all investors send sum to pooling contract during raising
            for (let i in investors)
                await pool.sendTransaction({value: tw(0.06), from: investors[i]});
            // set ST_MONEY_BACK state by admin account
            await pool.setState(ST_MONEY_BACK, {from: ADMIN});
            // Getting current state
            let state = await pool.getState();
            // Check that current state == ST_MONEY_BACK
            assert(state.eq(ST_MONEY_BACK));
        });
    });

    describe('Complex integration Tests', () => {
        it('RAISING => SEND 3 ETH => Return 10% to stakeholders => send 3 ** 18 tokens to investors => DEPRICATED', async () => {
            // set RAISING state by Pool manager account
            await pool.setState(ST_RAISING, {from: POOL_MANAGER});
            // Getting current state
            let state = await pool.getState();
            // Check that current state == ST_RAISING
            assert(state.eq(ST_RAISING));
            // INVEST SUM to one investor will be 0.6 ETH
            const INVEST_SUM = tw(0.6);
            // all investors send sum to pooling contract during raising
            for (let i in investors)
                await pool.sendTransaction({value: INVEST_SUM, from: investors[i]});
            // getting balance of pooling contract after invest
            let accountBalance = web3.eth.getBalance(pool.address);
            // check that pooling contract have all ETH from investors
            assert(accountBalance.eq(INVEST_SUM.mul(5)));
            // check that totalShare variable is working fine (showing all collected ETH)
            assert(accountBalance.eq(await pool.totalShare()));
            // set WAIT_FOR_ICO state by ICO manager account
            await pool.setState(ST_WAIT_FOR_ICO, {from: ICO_MANAGER});
            // Getting current state
            let stateTwo = await pool.getState();
            // Check that current state == ST_WAIT_FOR_ICO
            assert(stateTwo.eq(ST_WAIT_FOR_ICO));
            // total amount of collected tokens
            let totalSentETH = await pool.totalShare();
            // (Percent share of ICO manager from total sent ETH) multiplyed by DECIMAL_MULTIPLIER (1e18)
            let icoManagerPersentageShare = await pool.stakeholderShare(RL_ICO_MANAGER);
            // Calculate icoManagerETHShare
            let icoManagerETHShare = totalSentETH.mul(icoManagerPersentageShare).divToInt(1e18);
            // get all ETH by ICO manager
            let sumToICOManager = await pool.getStakeholderBalanceOf(RL_ICO_MANAGER);
            // check that share for ICO manager is calculated properly
            assert(sumToICOManager.eq(icoManagerETHShare), "share error");
            // get balance of ICO manager before release
            let managerBalanceBefore = await web3.eth.getBalance(ICO_MANAGER);
            // get all ETH by ICO manager to it's account
            let instance = await pool.releaseEtherToStakeholder(sumToICOManager, {from: ICO_MANAGER, gasPrice: gasPrice});
            // calculate fee in ETH that ICO manager spent while using releaseEtherToStakeholder function
            let feeForManager = (instance.receipt.gasUsed)*(gasPrice);
            // Balance of ICO manager after realeasing
            let managerBalanceAfter = await web3.eth.getBalance(ICO_MANAGER);
            // Balance of Contract after realeasing
            let accountBalanceAfter =  await web3.eth.getBalance(pool.address);
            // check that ico manager get his share part in ETH properly
            assert((managerBalanceBefore).eq(((managerBalanceAfter.plus(feeForManager)).minus(icoManagerETHShare))), "balance ICO mng error");
            // check that pooling balance now is less than before by icoManagerETHShare value
            assert(accountBalance.eq(accountBalanceAfter.plus(icoManagerETHShare)));
            // check that pooling balance now is less than before by sumToICOManager value == icoManagerETHShare
            assert(accountBalance.eq(accountBalanceAfter.plus(sumToICOManager)));
            // apporove pooling address from ICO manager (give tokens to pooling)
            await token.approve(pool.address, tw(3), {from: ICO_MANAGER});
            // check that approval is right
            assert((await token.allowance(ICO_MANAGER, pool.address)).eq(tw(3)));
            // accept tokens form ico
            await pool.acceptTokenFromICO(tw(3), {from: ICO_MANAGER});
            // set token distribution state
            await pool.setState(ST_TOKEN_DISTRIBUTION, {from: ICO_MANAGER});
            // Getting current state
            let stateThree = await pool.getState();
            // Check that current state == ST_TOKEN_DISTRIBUTION
            assert(stateThree.eq(ST_TOKEN_DISTRIBUTION));
            // check that tokens for investors are calculated right and release it
            for (let i in investors) {
                // balance of tokens from contract
                let b = await pool.getBalanceTokenOf(investors[i]);
                // check calculation from JS to check that contract logic is right
                assert(b.eq((tw(0.6)).mul(tw(3)).div(totalSentETH)));
                // release tokens for investors
                await pool.releaseToken(b, {from: investors[i]});
            }
            // check that balance of investors in tokens is that was promised by pooling
            for (let i in investors) {
                // balance of investor in tokens
                let poolingTokenBalance = await token.balanceOf(investors[i]);
                // check that
                assert(poolingTokenBalance.eq((tw(0.6)).mul(tw(3)).div(totalSentETH)));
            }
            // get % part sum in ETH of pool manager
            let poolManagerShare = await pool.stakeholderShare(RL_POOL_MANAGER);
            // get % part sum in ETH of ADMIN
            let adminShare =  await pool.stakeholderShare(RL_ADMIN);
            // get ETH part if pool manager
            let poolManagerPart = totalSentETH.mul(poolManagerShare).divToInt(1e18);
            // get ETH part if admin
            let adminPart = totalSentETH.mul(adminShare).divToInt(1e18);
            // get ETH part if pool mng from contract
            let poolShareFromContract = await pool.getStakeholderBalanceOf(RL_POOL_MANAGER);
            // get ETH part if admin from contract
            let adminShareFromContract = await pool.getStakeholderBalanceOf(RL_ADMIN);
            // check that part for pool manager is calculated right
            assert(poolShareFromContract.eq(poolManagerPart), "pool share error");
            // check that part for admin is calculated right
            assert(adminShareFromContract.eq(adminPart), "admin share error");
            // get Balance of POOl manager before in ETH
            let balancePoolMngBefore = await web3.eth.getBalance(POOL_MANAGER);
            // get Balance of ADMIN before in ETH
            let balanceAdminBefore = await web3.eth.getBalance(ADMIN);
            // release ETH to Pool manager
            let instancePool = await pool.releaseEtherToStakeholder(poolShareFromContract, {from: POOL_MANAGER, gasPrice: gasPrice});
            // release ETH to admin
            let instanceAdmin = await pool.releaseEtherToStakeholder(adminPart, {from: ADMIN, gasPrice: gasPrice});
            // fee of pool manager tx
            let feePool = gasPrice * instancePool.receipt.gasUsed;
            // fee of admin tx
            let feeAdmin = gasPrice * instanceAdmin.receipt.gasUsed;
            // new balance of pool manager in ETH
            let balancePoolMngNow = await web3.eth.getBalance(POOL_MANAGER);
            // new balance of pool manager in ETH
            let balanceAdminNow = await web3.eth.getBalance(ADMIN);
            // check that stake holders release correct sum of ETH
            assert((balancePoolMngNow.minus(poolManagerPart)).eq((balancePoolMngBefore.minus(feePool))));
            assert((balanceAdminNow.minus(adminPart)).eq((balanceAdminBefore.minus(feeAdmin))), "admin error");
            // add DISTRIBUTION_PERIOD to time state
            await pool.incTimestamp(DISTRIBUTION_PERIOD);
            // get current state
            let stateFour = await pool.getState();
            // check that current state == ST_FUND_DEPRECATED
            assert(stateFour.eq(ST_FUND_DEPRECATED));
            // balance of ADMIN in tokens before
            let balanceBeforeAdmin = await token.balanceOf(ADMIN);
            // balance of pooling contract in tokens
            let tokenContractBalance = await token.balanceOf(pool.address);
            // data transaction
            let data = String((web3.eth.contract(IERC20_ABI).at(token).transfer.getData(ADMIN, tokenContractBalance)));
            // transfer tokens to admin from pooling contract by admin
            await pool.execute(token.address, 0, data, {from: ADMIN, gasPrice: gasPrice});
            // balance after of admin in tokens
            let balanceAfterAdmin = await token.balanceOf(ADMIN);
            // check that admin return this amount of tokens correctly
            assert(balanceBeforeAdmin.eq(balanceAfterAdmin.minus(tokenContractBalance)));
        });

        it('RAISING => MONEY BACK', async () => {
            // set RAISING state by Pool manager account
            await pool.setState(ST_RAISING, {from: POOL_MANAGER});
            // Getting current state
            let state = await pool.getState();
            // Check that current state == ST_RAISING
            assert(state.eq(ST_RAISING));
            // INVEST SUM to one investor will be 0.6 ETH
            const INVEST_SUM = tw(0.6);
            // all investors send sum to pooling contract during raising
            for (let i = 4; i < 10; i++) {
                await pool.sendTransaction({value: INVEST_SUM, from: accounts[i]});
            }
            // getting balance of pooling contract after invest
            let accountBalance = web3.eth.getBalance(pool.address);
            // check that pooling contract have all ETH from investors
            assert(accountBalance.eq(INVEST_SUM.mul(6)));
            // check that totalShare variable is working fine (showing all collected ETH)
            assert(accountBalance.eq(await pool.totalShare()));
            // set state money back
            await pool.setState(ST_MONEY_BACK, {from: ADMIN});
            // check that state is MONEY_BACK
            assert((await pool.getState()).eq(ST_MONEY_BACK));
            // array of ETH that investor get from contract
            let delta = [];
            delta.push(0);
            delta.push(0);
            delta.push(0);
            delta.push(0);
            // update this array
            for(let i = 4; i < 10; i++) {
                let bal = await pool.getBalanceEtherOf(accounts[i]);
                delta.push(bal);
            }
            // array of investors balances before refund
            let balancesBefore = [];
            balancesBefore.push(0);
            balancesBefore.push(0);
            balancesBefore.push(0);
            balancesBefore.push(0);
            // fee in WEI that investors spent on refundShare
            let fees = [];
            fees.push(0);
            fees.push(0);
            fees.push(0);
            fees.push(0);
            // balance of investors in ETH before refundShare
            for(let i = 4; i < 10; i++) {
                // get balance of investor
                let bal = await web3.eth.getBalance(accounts[i]);
                balancesBefore.push(bal)
            }
            // return money back by refundShare function
            for(let i = 4; i < 10; i++) {
                // get balance of investor
                let bal = await pool.getBalanceEtherOf(accounts[i]);
                // refund ETH to investor
                let instance = await pool.refundShare(bal, {from: accounts[i], gasPrice: gasPrice});
                fees.push(gasPrice * instance.receipt.gasUsed);
            }
            // array of investors balances after refund
            let balancesAfter = [];
            balancesAfter.push(0);
            balancesAfter.push(0);
            balancesAfter.push(0);
            balancesAfter.push(0);
            // balance of investors in ETH after refundShare
            for(let i = 4; i < 10; i++) {
                // get balance of investor
                let bal = await web3.eth.getBalance(accounts[i]);
                balancesAfter.push(bal);
            }
            // check that balance before + fees == balanceAfter + delta
            for(let i = 4; i < 10; i++) {
                assert(((balancesBefore[i]).plus(delta[i])).eq(((balancesAfter[i]).plus(fees[i]))));
            }
        });
    });
});