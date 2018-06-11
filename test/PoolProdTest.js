const Pool = artifacts.require("./PoolProd.sol");
const Token = artifacts.require("./TestToken.sol");

const web3 = global.web3;

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
    }

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
});