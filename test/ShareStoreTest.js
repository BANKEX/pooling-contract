const ShareStoreTest = artifacts.require("./ShareStoreTest.sol");
const Token = artifacts.require("./TestToken.sol");

const web3 = global.web3;

const tbn = v => web3.toBigNumber(v);
const fbn = v => v.toString();
const tw = v => web3.toBigNumber(v).mul(1e18);
const fw = v => web3._extend.utils.fromWei(v).toString();

const TOKEN_SUPPLY = tw(10);
const MINIMAL_DEPOSIT_SIZE = tw(0.05)

const TI_DAY = tbn(86400);

const ST_DEFAULT = tbn(0x00);
const ST_RAISING = tbn(0x01);
const ST_WAIT_FOR_ICO = tbn(0x02);
const ST_MONEY_BACK = tbn(0x04);
const ST_TOKEN_DISTRIBUTION = tbn(0x08);
const ST_FUND_DEPRECATED = tbn(0x10);

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
const INVESTOR_SUM_TO_TRIGGER = tw(0.00001);

const RL_DEFAULT = tbn(0x00);
const RL_POOL_MANAGER = tbn(0x01);
const RL_ICO_MANAGER = tbn(0x02);
const RL_ADMIN = tbn(0x04);
const RL_PAYBOT = tbn(0x08);

contract('ShareStore COMMON TEST', (accounts) => {

    it("Token address must be tokenLocal.address", async function () {
        let tokenLocal = await Token.new(TOKEN_SUPPLY);
        let shareLocal = await ShareStoreTest.new(MINIMAL_DEPOSIT_SIZE, tokenLocal.address);
        assert.equal(tokenLocal.address, await shareLocal.tokenAddress());
    });

    it("should allow to collect ether during raising", async function () {
        let tokenLocal = await Token.new(TOKEN_SUPPLY);
        let shareLocal = await ShareStoreTest.new(MINIMAL_DEPOSIT_SIZE, tokenLocal.address);
        await shareLocal.setRoleTestData(RL_POOL_MANAGER, accounts[0]);
        await shareLocal.setState(ST_RAISING);
        assert(ST_RAISING.eq(await shareLocal.getState()));
        for (let i = 3; i < 10; i++) {
            await shareLocal.sendTransaction({value: INVESTOR_SUM_PAY, from: accounts[i]});
        }
        let investedSum = INVESTOR_SUM_PAY.mul(7);
        assert(investedSum.eq(await shareLocal.totalShare()));
    });

    it("should allow to start wait for ico and release tokens from pooling", async function () {
        const gasPrice = tw("3e-7");
        let tokenLocal = await Token.new(TOKEN_SUPPLY);
        let shareLocal = await ShareStoreTest.new(MINIMAL_DEPOSIT_SIZE, tokenLocal.address);
        await shareLocal.setRoleTestData(RL_POOL_MANAGER, accounts[0]);
        await shareLocal.setState(ST_RAISING, {from: accounts[0]});
        assert(ST_RAISING.eq(await shareLocal.getState()));
        for (let i = 3; i < 10; i++) {
            await shareLocal.sendTransaction({value: INVESTOR_SUM_PAY, from: accounts[i]});
        }
        let investedSum = INVESTOR_SUM_PAY.mul(7);
        await shareLocal.setRoleTestData(RL_ICO_MANAGER, accounts[2]);
        await shareLocal.setState(ST_WAIT_FOR_ICO, {form: accounts[2]});
        let balBefore = await web3.eth.getBalance(accounts[2]);
        let allowedBalance = await shareLocal.getStakeholderBalanceOf(RL_ICO_MANAGER);
        let instance = await shareLocal.releaseEtherToStakeholder(allowedBalance, {
            from: accounts[2],
            gasPrice: gasPrice
        });
        let gasUsed = instance.receipt.gasUsed;
        let transactionCost = gasUsed * gasPrice;
        let balAfter = (await web3.eth.getBalance(accounts[2]));
        assert(balBefore.eq((balAfter.minus(allowedBalance)).plus(transactionCost)));
    });

    it("should allow to release tokens to investors", async function () {
        const gasPrice = tw("3e-7");
        let tokenLocal = await Token.new(TOKEN_SUPPLY);
        let shareLocal = await ShareStoreTest.new(MINIMAL_DEPOSIT_SIZE, tokenLocal.address);
        await shareLocal.setRoleTestData(RL_POOL_MANAGER, accounts[0]);
        await shareLocal.setState(ST_RAISING);
        assert(ST_RAISING.eq(await shareLocal.getState()));
        for (let i = 3; i < 10; i++) {
            await shareLocal.sendTransaction({value: INVESTOR_SUM_PAY, from: accounts[i]});
        }
        let investedSum = INVESTOR_SUM_PAY.mul(7);
        await shareLocal.setRoleTestData(RL_ICO_MANAGER, accounts[2]);
        await shareLocal.setState(ST_WAIT_FOR_ICO);
        let balBefore = await web3.eth.getBalance(accounts[2]);
        let allowedBalance = await shareLocal.getStakeholderBalanceOf(RL_ICO_MANAGER);
        let instance = await shareLocal.releaseEtherToStakeholder(allowedBalance, {
            from: accounts[2],
            gasPrice: gasPrice
        });
        let gasUsed = instance.receipt.gasUsed;
        let transactionCost = gasUsed * gasPrice;
        let balAfter = (await web3.eth.getBalance(accounts[2]));
        assert(balBefore.eq((balAfter.minus(allowedBalance)).plus(transactionCost)));
        await tokenLocal.approve(shareLocal.address, TOKEN_SUPPLY, {from: accounts[0]});
        let allowedTokens = await tokenLocal.allowance(accounts[0], shareLocal.address);
        await shareLocal.acceptTokenFromICO(allowedTokens);
        await shareLocal.setState(ST_TOKEN_DISTRIBUTION);
        let tokenBalance = await shareLocal.getBalanceTokenOf(accounts[4]);
        await shareLocal.releaseToken(tokenBalance, {from: accounts[4]});
        assert(tokenBalance.eq(await tokenLocal.balanceOf(accounts[4])));
    });

    it("should allow to make money back for 6 investors", async function () {
        const gasPrice = tw("3e-7");
        let tokenLocal = await Token.new(TOKEN_SUPPLY);
        let shareLocal = await ShareStoreTest.new(MINIMAL_DEPOSIT_SIZE, tokenLocal.address);
        await shareLocal.setRoleTestData(RL_POOL_MANAGER, accounts[0]);
        await shareLocal.setState(ST_RAISING);
        assert(ST_RAISING.eq(await shareLocal.getState()));
        for (let i = 3; i < 10; i++) {
            await shareLocal.sendTransaction({value: INVESTOR_SUM_PAY, from: accounts[i]});
        }
        let investedSum = INVESTOR_SUM_PAY.mul(7);
        await shareLocal.setRoleTestData(RL_ADMIN, accounts[1]);
        await shareLocal.setState(ST_MONEY_BACK, {from: accounts[1]});
        assert(ST_MONEY_BACK.eq(await shareLocal.getState()));

        let balancesBefore = [];
        balancesBefore.push(0);
        balancesBefore.push(0);
        balancesBefore.push(0);

        let feeFirst = [];
        feeFirst.push(0);
        feeFirst.push(0);
        feeFirst.push(0);

        let allowedSum = [];
        allowedSum.push(0);
        allowedSum.push(0);
        allowedSum.push(0);

        for (let i = 3; i < 10; i++) {
            let bb = await web3.eth.getBalance(accounts[i]);
            balancesBefore.push(bb);
        }

        for (let i = 3; i < 10; i++) {
            let balanceETH = await shareLocal.getBalanceEtherOf(accounts[i]);
            allowedSum.push(balanceETH);
            let instanced = await shareLocal
                .releaseEther(balanceETH, {from: accounts[i], gasPrice: gasPrice});
            feeFirst.push(instanced.receipt.gasUsed * gasPrice);
        }

        let balancesAfter = [];
        balancesAfter.push(0);
        balancesAfter.push(0);
        balancesAfter.push(0);

        for (let i = 3; i < 10; i++) {
            let bb = await web3.eth.getBalance(accounts[i]);
            balancesAfter.push(bb);
        }

        for (let i = 3; i < 10; i++) {
            assert(((balancesAfter[i]).plus(feeFirst[i])).eq((balancesBefore[i]).plus(allowedSum[i])))
        }
    });

    it("should allow to release tokens for 6 investors and take some ether that ico manager don't take", async function () {
        const gasPrice = tw("3e-7");
        let tokenLocal = await Token.new(TOKEN_SUPPLY);
        let shareLocal = await ShareStoreTest.new(MINIMAL_DEPOSIT_SIZE, tokenLocal.address);
        await shareLocal.setRoleTestData(RL_POOL_MANAGER, accounts[0]);
        await shareLocal.setState(ST_RAISING, {from: accounts[0]});
        assert(ST_RAISING.eq(await shareLocal.getState()));
        for (let i = 3; i < 10; i++) {
            await shareLocal.sendTransaction({value: INVESTOR_SUM_PAY, from: accounts[i]});
        }
        let investedSum = INVESTOR_SUM_PAY.mul(7);
        await shareLocal.setRoleTestData(RL_ICO_MANAGER, accounts[2]);
        await shareLocal.setState(ST_WAIT_FOR_ICO, {form: accounts[2]});

        await shareLocal.releaseEtherToStakeholder(100000, {
            gasPrice: gasPrice
        });

        await tokenLocal.approve(shareLocal.address, TOKEN_SUPPLY, {from: accounts[0]});
        let allowedTokens = await tokenLocal.allowance(accounts[0], shareLocal.address);
        await shareLocal.acceptTokenFromICO(allowedTokens);
        await shareLocal.setState(ST_TOKEN_DISTRIBUTION);

        let balancesBefore = [];
        balancesBefore.push(0);
        balancesBefore.push(0);
        balancesBefore.push(0);

        let feeFirst = [];
        feeFirst.push(0);
        feeFirst.push(0);
        feeFirst.push(0);

        let allowedSum = [];
        allowedSum.push(0);
        allowedSum.push(0);
        allowedSum.push(0);

        let allowedTokensOF = [];
        allowedTokensOF.push(0);
        allowedTokensOF.push(0);
        allowedTokensOF.push(0);

        for (let i = 3; i < 10; i++) {
            let bb = await web3.eth.getBalance(accounts[i]);
            balancesBefore.push(bb);
        }

        for (let i = 3; i < 10; i++) {
            let tb = await shareLocal.getBalanceTokenOf(accounts[i]);
            let instnace1 = await shareLocal.releaseToken(tb, {from: accounts[i], gasPrice: gasPrice});
            let eb = await shareLocal.getBalanceEtherOf(accounts[i]);
            let instnace2 = await shareLocal.releaseEther(eb, {from: accounts[i], gasPrice: gasPrice});
            let gasUsedTwo = instnace1.receipt.gasUsed + instnace2.receipt.gasUsed;
            feeFirst.push(gasUsedTwo * gasPrice);
            allowedSum.push(eb);
            allowedTokensOF.push(tb);
        }

        let balancesAfter = [];
        balancesAfter.push(0);
        balancesAfter.push(0);
        balancesAfter.push(0);

        for (let i = 3; i < 10; i++) {
            let bb = await web3.eth.getBalance(accounts[i]);
            balancesAfter.push(bb);
        }

        for (let i = 3; i < 10; i++) {
            assert(((balancesAfter[i]).plus(feeFirst[i])).eq((balancesBefore[i]).plus(allowedSum[i])));
            assert((await tokenLocal.balanceOf(accounts[i])).eq(allowedTokensOF[i]));
        }


    });

    it("should allow to take ether and tokens after depricated time", async function () {
        const gasPrice = tw("3e-7");
        let tokenLocal = await Token.new(TOKEN_SUPPLY);
        let shareLocal = await ShareStoreTest.new(MINIMAL_DEPOSIT_SIZE, tokenLocal.address);
        await shareLocal.setRoleTestData(RL_POOL_MANAGER, accounts[0]);
        await shareLocal.setState(ST_RAISING, {from: accounts[0]});
        assert(ST_RAISING.eq(await shareLocal.getState()));
        for (let i = 3; i < 10; i++) {
            await shareLocal.sendTransaction({value: INVESTOR_SUM_PAY, from: accounts[i]});
        }

        await shareLocal.setRoleTestData(RL_ICO_MANAGER, accounts[2]);
        await shareLocal.setState(ST_WAIT_FOR_ICO, {form: accounts[2]});

        await shareLocal.releaseEtherToStakeholder(100000, {
            gasPrice: gasPrice
        });

        await tokenLocal.approve(shareLocal.address, TOKEN_SUPPLY, {from: accounts[0]});
        let allowedTokens = await tokenLocal.allowance(accounts[0], shareLocal.address);
        await shareLocal.acceptTokenFromICO(allowedTokens);
        await shareLocal.setState(ST_TOKEN_DISTRIBUTION);

        let balancesBefore = [];
        balancesBefore.push(0);
        balancesBefore.push(0);
        balancesBefore.push(0);

        let feeFirst = [];
        feeFirst.push(0);
        feeFirst.push(0);
        feeFirst.push(0);

        let allowedSum = [];
        allowedSum.push(0);
        allowedSum.push(0);
        allowedSum.push(0);

        let allowedTokensOF = [];
        allowedTokensOF.push(0);
        allowedTokensOF.push(0);
        allowedTokensOF.push(0);

        for (let i = 3; i < 7; i++) {
            let bb = await web3.eth.getBalance(accounts[i]);
            balancesBefore.push(bb);
        }

        for (let i = 3; i < 7; i++) {
            let tb = await shareLocal.getBalanceTokenOf(accounts[i]);
            let instnace1 = await shareLocal.releaseToken(tb, {from: accounts[i], gasPrice: gasPrice});
            let eb = await shareLocal.getBalanceEtherOf(accounts[i]);
            let instnace2 = await shareLocal.releaseEther(eb, {from: accounts[i], gasPrice: gasPrice});
            let gasUsedTwo = instnace1.receipt.gasUsed + instnace2.receipt.gasUsed;
            feeFirst.push(gasUsedTwo * gasPrice);
            allowedSum.push(eb);
            allowedTokensOF.push(tb);
        }

        let balancesAfter = [];
        balancesAfter.push(0);
        balancesAfter.push(0);
        balancesAfter.push(0);

        for (let i = 3; i < 7; i++) {
            let bb = await web3.eth.getBalance(accounts[i]);
            balancesAfter.push(bb);
        }

        for (let i = 3; i < 7; i++) {
            assert(((balancesAfter[i]).plus(feeFirst[i])).eq((balancesBefore[i]).plus(allowedSum[i])));
            assert((await tokenLocal.balanceOf(accounts[i])).eq(allowedTokensOF[i]));
        }

        // await shareLocal.setState(ST_WAIT_FOR_ICO);
        // assert(ST_WAIT_FOR_ICO.eq(await shareLocal.getState()));
        // let thisbb = await shareLocal.getStakeholderBalanceOf(RL_ICO_MANAGER);
        // await shareLocal.releaseEtherToStakeholder(900, {
        //     gasPrice: gasPrice,
        // });

        //  Problem with parts

    });

    it("should allow to take stakeholders parts after wait for ico", async function () {

    });

    it("should allow to make refund during raising", async function () {
    });

    it("should allow to release ether and tokens by force from admin", async function () {
    });

    it("should allow to release ether and tokens just by payable function", async function () {
    });

});