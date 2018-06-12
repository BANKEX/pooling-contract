const ShareStoreTest = artifacts.require("./ShareStoreTest.sol");
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

const gasPrice = tw("3e-7");

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
                .refundShare(balanceETH, {from: accounts[i], gasPrice: gasPrice});
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
        let admin = accounts[9];
        let shareLocal = await ShareStoreTest.new(MINIMAL_DEPOSIT_SIZE, tokenLocal.address);
        await shareLocal.setRoleTestData(RL_POOL_MANAGER, accounts[0]);
        await shareLocal.setState(ST_RAISING, {from: accounts[0]});
        assert(ST_RAISING.eq(await shareLocal.getState()));
        for (let i = 3; i < 8; i++) {
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
            feeFirst.push(gasPrice.mul(gasUsedTwo));
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

        await shareLocal.setRoleTestData(RL_ADMIN, admin);
        await shareLocal.setState(ST_FUND_DEPRECATED);
        let adminBalance = await web3.eth.getBalance(admin);
        let adminTokenBalance = await tokenLocal.balanceOf(admin);
        let ethContractBalance = await web3.eth.getBalance(shareLocal.address);
        let tokenContractBalance = await tokenLocal.balanceOf(shareLocal.address);
        let data = String((web3.eth.contract(IERC20_ABI).at(tokenLocal).transfer.getData(admin, tokenContractBalance)));
        let depricaction_tx1 = await shareLocal.execute(tokenLocal.address, 0, data, {from: admin, gasPrice: gasPrice});
        let depricaction_tx2 = await shareLocal.execute(admin, ethContractBalance, 0, {from: admin, gasPrice: gasPrice});
        let gasCost = gasPrice.mul(depricaction_tx1.receipt.gasUsed).plus(gasPrice.mul(depricaction_tx2.receipt.gasUsed));
        let adminBalanceAfterDepricated = await web3.eth.getBalance(admin);
        let adminTokenBalanceAfterDepricated = await tokenLocal.balanceOf(admin);
        assert(adminBalanceAfterDepricated.eq(adminBalance.plus(ethContractBalance).minus(gasCost)));
        assert(adminTokenBalanceAfterDepricated.eq(adminTokenBalance.plus(tokenContractBalance)));
    });

    it("should allow to release ether and tokens by force from admin", async function () {
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

        for (let i = 3; i < 10; i++) {
            let bb = await web3.eth.getBalance(accounts[i]);
            balancesBefore.push(bb);
        }

        await shareLocal.setRoleTestData(RL_ADMIN, accounts[1]);

        for (let i = 3; i < 10; i++) {
            let tb = await shareLocal.getBalanceTokenOf(accounts[i]);
            let instnace1 = await shareLocal.releaseTokenForce(accounts[i], tb, {
                from: accounts[1],
                gasPrice: gasPrice
            });
            let eb = await shareLocal.getBalanceEtherOf(accounts[i]);
            let instnace2 = await shareLocal.releaseEtherForce(accounts[i], eb, {
                from: accounts[1],
                gasPrice: gasPrice
            });
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
            assert(((balancesAfter[i])).eq((balancesBefore[i]).plus(allowedSum[i])));
            assert((await tokenLocal.balanceOf(accounts[i])).eq(allowedTokensOF[i]));
        }
    });

    it("should allow to release ether and tokens just by payable function", async function () {
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
        assert(ST_TOKEN_DISTRIBUTION.eq(await shareLocal.getState()), "DISTRIBUTION ERROR");
        let balancesBefore = [];
        balancesBefore.push(0);
        balancesBefore.push(0);
        balancesBefore.push(0);

        for (let i = 3; i < 10; i++) {
            let bb = await web3.eth.getBalance(accounts[i]);
            balancesBefore.push(bb);
        }

        await shareLocal.sendTransaction({value: INVESTOR_SUM_PAY, from: accounts[1]});

        assert((await tokenLocal.balanceOf(accounts[1])).eq(await shareLocal.getBalanceTokenOf(accounts[1])));

    });

    it('should allow to money back by payable function', async function () {
        const gasPrice = tw("3e-7");
        let tokenLocal = await Token.new(TOKEN_SUPPLY);
        let shareLocal = await ShareStoreTest.new(MINIMAL_DEPOSIT_SIZE, tokenLocal.address);
        await shareLocal.setRoleTestData(RL_POOL_MANAGER, accounts[0]);
        await shareLocal.setState(ST_RAISING, {from: accounts[0]});
        let balanceFirst = await web3.eth.getBalance(accounts[4]);
        let fees = [];
        fees.push(0);
        fees.push(0);
        fees.push(0);
        assert(ST_RAISING.eq(await shareLocal.getState()));
        for (let i = 3; i < 10; i++) {
            let b = await shareLocal.sendTransaction({value: INVESTOR_SUM_PAY, from: accounts[i], gasPrice: gasPrice});
            fees.push(b.receipt.gasUsed * gasPrice);
        }
        await shareLocal.setRoleTestData(RL_ICO_MANAGER, accounts[2]);
        await shareLocal.setState(ST_MONEY_BACK);
        assert(ST_MONEY_BACK.eq(await shareLocal.getState()));
        let balancesBefore = [];
        balancesBefore.push(0);
        balancesBefore.push(0);
        balancesBefore.push(0);

        for (let i = 3; i < 10; i++) {
            let bb = await web3.eth.getBalance(accounts[i]);
            balancesBefore.push(bb);
        }
        let instance = await shareLocal.sendTransaction({
            value: INVESTOR_SUM_PAY,
            from: accounts[4],
            gasPrice: gasPrice
        });
        let fee = instance.receipt.gasUsed * gasPrice;
        let balanceAfter = ((await web3.eth.getBalance(accounts[4])).plus((fee + fees[4])));
        assert((balanceFirst).eq(balanceAfter));
    })
    it('should allow to money back by force', async function () {
        const gasPrice = tw("3e-7");
        let tokenLocal = await Token.new(TOKEN_SUPPLY);
        let shareLocal = await ShareStoreTest.new(MINIMAL_DEPOSIT_SIZE, tokenLocal.address);
        await shareLocal.setRoleTestData(RL_POOL_MANAGER, accounts[0]);
        await shareLocal.setState(ST_RAISING, {from: accounts[0]});
        let balanceFirst = await web3.eth.getBalance(accounts[4]);
        let fees = [];
        fees.push(0);
        fees.push(0);
        fees.push(0);
        assert(ST_RAISING.eq(await shareLocal.getState()));
        for (let i = 3; i < 10; i++) {
            let b = await shareLocal.sendTransaction({value: INVESTOR_SUM_PAY, from: accounts[i], gasPrice: gasPrice});
            fees.push(b.receipt.gasUsed * gasPrice);
        }
        await shareLocal.setRoleTestData(RL_ICO_MANAGER, accounts[2]);
        await shareLocal.setState(ST_MONEY_BACK);
        assert(ST_MONEY_BACK.eq(await shareLocal.getState()));
        let balancesBefore = [];
        balancesBefore.push(0);
        balancesBefore.push(0);
        balancesBefore.push(0);
        for (let i = 3; i < 10; i++) {
            let bb = await web3.eth.getBalance(accounts[i]);
            balancesBefore.push(bb);
        }
        await shareLocal.setRoleTestData(RL_ADMIN, accounts[1]);
        let share = await shareLocal.share(accounts[4]);
        await shareLocal.refundShareForce(accounts[4], share, {from: accounts[1]});
        assert((balanceFirst).eq((await web3.eth.getBalance(accounts[4])).plus(fees[4])))
    });

});

contract('ShareStore NEGATIVE TEST', (accounts) => {

    let getBalances = async () => {
        let a = [];
        a.push(0);
        a.push(0);
        a.push(0);

        for (let i = 3; i < 10; i++) {
            a.push(await web3.eth.getBalance(accounts[i]));
        }
        return a;
    };

    let payByAccounts = async (sum, pooling) => {
        let fees = [];
        fees.push(0);
        fees.push(0);
        fees.push(0);
        for (let i = 3; i < 10; i++) {
            let instance = (await pooling.sendTransaction({value: sum, gasPrice: gasPrice, from: accounts[i]}));
            fees.push(instance.receipt.gasUsed * gasPrice);
        }
        return fees;
    };

    it('should not allow to pay if not raising', async function () {
        let tokenLocal = await Token.new(TOKEN_SUPPLY);
        let shareLocal = await ShareStoreTest.new(MINIMAL_DEPOSIT_SIZE, tokenLocal.address);
        assert(ST_DEFAULT.eq(await shareLocal.getState()));

        try {
            await payByAccounts(tw(0.1), shareLocal);
        }
        catch (err) {
        }
        for (let i = 3; i < 10; i++) {
            assert((await shareLocal.totalShare()).eq(tw(0)));
        }
    });

    it('should not allow to buyShare if not raising', async function () {
        let tokenLocal = await Token.new(TOKEN_SUPPLY);
        let shareLocal = await ShareStoreTest.new(MINIMAL_DEPOSIT_SIZE, tokenLocal.address);
        assert(ST_DEFAULT.eq(await shareLocal.getState()));
        try {
            for (let i = 3; i < 10; i++) {
                await shareLocal.buyShare({from: accounts[i], value: INVESTOR_SUM_PAY, gasPrice: gasPrice});
            }
        }
        catch (err) {
        }
        for (let i = 3; i < 10; i++) {
            assert((await shareLocal.totalShare()).eq(tw(0)));
        }
    });


    it('should not allow to return money if not money back', async function () {
        let tokenLocal = await Token.new(TOKEN_SUPPLY);
        let shareLocal = await ShareStoreTest.new(MINIMAL_DEPOSIT_SIZE, tokenLocal.address);
        assert(ST_DEFAULT.eq(await shareLocal.getState()));
        await shareLocal.setRoleTestData(RL_POOL_MANAGER, accounts[0]);
        await shareLocal.setState(ST_RAISING, {from: accounts[0]});
        assert(ST_RAISING.eq(await shareLocal.getState()));
        await payByAccounts(tw(0.1), shareLocal);
        let balanceBefore = [];
        balanceBefore.push(0);
        balanceBefore.push(0);
        balanceBefore.push(0);
        for (let i = 3; i < 10; i++) {
            balanceBefore.push(await shareLocal.getBalanceEtherOf(accounts[i]));
        }
        try {
            for (let i = 3; i < 10; i++) {
                let balanceETH = await shareLocal.getBalanceEtherOf(accounts[i]);
                await shareLocal.refundShare(balanceETH, {from: accounts[i], gasPrice: gasPrice})
            }
        }
        catch (err) {
        }
        for (let i = 3; i < 10; i++) {
            let balanceNow = await shareLocal.getBalanceEtherOf(accounts[i]);
            assert(balanceNow.eq(balanceBefore[i]));
        }
    });


    it('should not allow to collect ether and tokens if not fund depricaction', async function () {
        let tokenLocal = await Token.new(TOKEN_SUPPLY);
        let shareLocal = await ShareStoreTest.new(MINIMAL_DEPOSIT_SIZE, tokenLocal.address);
        assert(ST_DEFAULT.eq(await shareLocal.getState()));
        await shareLocal.setRoleTestData(RL_POOL_MANAGER, accounts[0]);
        await shareLocal.setState(ST_RAISING, {from: accounts[0]});
        assert(ST_RAISING.eq(await shareLocal.getState()));

        await payByAccounts(tw(0.1), shareLocal);
        await shareLocal.setRoleTestData(RL_ICO_MANAGER, accounts[0]);
        await shareLocal.setState(ST_WAIT_FOR_ICO, {from: accounts[0]});
        await shareLocal.releaseEtherToStakeholder(100000, {
            gasPrice: gasPrice
        });
        await tokenLocal.approve(shareLocal.address, TOKEN_SUPPLY, {from: accounts[0]});
        let allowedTokens = await tokenLocal.allowance(accounts[0], shareLocal.address);
        await shareLocal.acceptTokenFromICO(allowedTokens);
        try {
            for (let i = 3; i < 7; i++) {
                let tb = await shareLocal.getBalanceTokenOf(accounts[i]);
                let instnace1 = await shareLocal.releaseToken(tb, {from: accounts[i], gasPrice: gasPrice});
                let eb = await shareLocal.getBalanceEtherOf(accounts[i]);
                let instnace2 = await shareLocal.releaseEther(eb, {from: accounts[i], gasPrice: gasPrice});
                let gasUsedTwo = instnace1.receipt.gasUsed + instnace2.receipt.gasUsed;
            }
        }
        catch (err) {
        }
        assert((await tokenLocal.balanceOf(accounts[4])).eq(tw(0)));
    });

    it('should not allow to collect ether and tokens by force if not fund depricaction', async function () {
        let tokenLocal = await Token.new(TOKEN_SUPPLY);
        let shareLocal = await ShareStoreTest.new(MINIMAL_DEPOSIT_SIZE, tokenLocal.address);
        assert(ST_DEFAULT.eq(await shareLocal.getState()));
        await shareLocal.setRoleTestData(RL_POOL_MANAGER, accounts[0]);
        await shareLocal.setState(ST_RAISING, {from: accounts[0]});
        assert(ST_RAISING.eq(await shareLocal.getState()));

        await payByAccounts(tw(0.1), shareLocal);
        await shareLocal.setRoleTestData(RL_ICO_MANAGER, accounts[0]);
        await shareLocal.setState(ST_WAIT_FOR_ICO, {from: accounts[0]});
        await shareLocal.releaseEtherToStakeholder(100000, {
            gasPrice: gasPrice
        });
        await tokenLocal.approve(shareLocal.address, TOKEN_SUPPLY, {from: accounts[0]});
        let allowedTokens = await tokenLocal.allowance(accounts[0], shareLocal.address);
        await shareLocal.acceptTokenFromICO(allowedTokens);
        await shareLocal.setRoleTestData(RL_ADMIN, accounts[0]);
        try {
            for (let i = 3; i < 7; i++) {
                let tb = await shareLocal.getBalanceTokenOf(accounts[i]);
                let instnace1 = await shareLocal.releaseTokenForce(accounts[i], tb, {
                    from: accounts[0],
                    gasPrice: gasPrice
                });
                let eb = await shareLocal.getBalanceEtherOf(accounts[i]);
                let instnace2 = await shareLocal.releaseEtherForce(accounts[i], eb, {
                    from: accounts[0],
                    gasPrice: gasPrice
                });
                let gasUsedTwo = instnace1.receipt.gasUsed + instnace2.receipt.gasUsed;
            }
        }
        catch (err) {
        }
        assert((await tokenLocal.balanceOf(accounts[4])).eq(tw(0)));
    });

    it('should not allow to accept tokens from ico if not pool mng and wait for ico', async function () {
        let tokenLocal = await Token.new(TOKEN_SUPPLY);
        let shareLocal = await ShareStoreTest.new(MINIMAL_DEPOSIT_SIZE, tokenLocal.address);
        assert(ST_DEFAULT.eq(await shareLocal.getState()));
        await shareLocal.setRoleTestData(RL_POOL_MANAGER, accounts[0]);
        await shareLocal.setState(ST_RAISING, {from: accounts[0]});
        assert(ST_RAISING.eq(await shareLocal.getState()));

        await payByAccounts(tw(0.1), shareLocal);
        await shareLocal.setRoleTestData(RL_ICO_MANAGER, accounts[0]);
        await shareLocal.setState(ST_WAIT_FOR_ICO, {from: accounts[0]});
        await shareLocal.releaseEtherToStakeholder(100000, {
            gasPrice: gasPrice
        });
        await tokenLocal.approve(shareLocal.address, TOKEN_SUPPLY, {from: accounts[0]});
        let allowedTokens = await tokenLocal.allowance(accounts[0], shareLocal.address);

        await shareLocal.setRoleTestData(RL_POOL_MANAGER, accounts[0]);
        try {
            await shareLocal.acceptTokenFromICO(allowedTokens);
        }
        catch (e) {
        }
        await shareLocal.setRoleTestData(RL_DEFAULT, accounts[0]);
        try {
            await shareLocal.acceptTokenFromICO(allowedTokens);
        }
        catch (e) {
        }
        await shareLocal.setRoleTestData(RL_PAYBOT, accounts[0]);
        try {
            await shareLocal.acceptTokenFromICO(allowedTokens);
        }
        catch (e) {
        }
        await shareLocal.setRoleTestData(RL_ADMIN, accounts[0]);
        try {
            await shareLocal.acceptTokenFromICO(allowedTokens);
        }
        catch (e) {
        }

        assert((await shareLocal.totalToken()).eq(tw(0)));
    });

});

contract('ShareStore CALC TEST', (accounts) => {
    it('should doing full cycle test', async function () {
        const poolManager = accounts[0];
        const icoManager = accounts[1];
        let tokenLocal = await Token.new(TOKEN_SUPPLY, {
            from: icoManager
        });
        let shareLocal = await ShareStoreTest.new(MINIMAL_DEPOSIT_SIZE, tokenLocal.address);
        await shareLocal.setRoleTestData(RL_POOL_MANAGER, poolManager);
        await shareLocal.setRoleTestData(RL_ICO_MANAGER, icoManager);
        await shareLocal.setState(ST_RAISING, {
            from: poolManager
        });

        let account = {
            account2: accounts[2],
            account3: accounts[3],
            account4: accounts[4],
            account5: accounts[5],
            account6: accounts[6],
            account7: accounts[7],
            account8: accounts[8],
            account9: accounts[9]
        }

        let sendValue = {
            account2: tw(1),
            account3: tw(1.23129432423),
            account4: tw(3.1111111),
            account5: tw(10.999999999),
            account6: tw(0.05000000000001),
            account7: tw(0.1111111119),
            account8: tw(9.191919191919),
            account9: tw(4.99911919991991)
        };

        let sendDestributionValue = {
            account2: tw(0.00000000000001),
            account3: tw(1),
            account4: tw(1.11111111111111111),
            account5: tw(9.0000001),
            account6: tw(2.222212221212),
            account7: tw(1.010001011010101),
            account8: tw(0.02222222),
            account9: tw(0.00010001000100001)
        };

        let initialBalance = {};
        let fee = {};
        let destributionFee = {};
        let tokenBalance = {};
        let distributeETHValues = {};
        let distributeETHFee = {};
        let distributeTokenValues = {};
        let distributeTokenFee = {};

        let releaseEtherToStakeholderValue = tw(1.5);
        let allowedValue = tw(2);
        let totalSendValue = tbn(0);
        let totalDestributedTokens = tw(0);

        for (let i in account)
            initialBalance[i] = await web3.eth.getBalance(account[i]);

        for (let i in account) {
            let tx = await shareLocal.buyShare({
                from: account[i],
                value: sendValue[i],
                gasPrice: gasPrice
            });
            totalSendValue = totalSendValue.plus(sendValue[i]);
            fee[i] = gasPrice.mul(tx.receipt.gasUsed);
        }

        for (let i in account) {
            let poolingETHbalance = await shareLocal.getBalanceEtherOf(account[i]);
            assert(sendValue[i].eq(poolingETHbalance));
        }

        let totalShare = await shareLocal.totalShare();
        assert(totalShare.eq(totalSendValue));

        await shareLocal.setState(ST_WAIT_FOR_ICO, {
            from: poolManager
        });

        let stakeholderShare = await shareLocal.stakeholderShare(2);
        let stakeholderBalance = await shareLocal.getStakeholderBalanceOf(RL_ICO_MANAGER);
        assert(totalSendValue.mul(stakeholderShare).div(1e18).eq(stakeholderBalance));

        let icoManagerBalanceBeforeReleaseETH = await web3.eth.getBalance(icoManager);
        let releaseETHToStakeholder = await shareLocal.releaseEtherToStakeholder(releaseEtherToStakeholderValue, {
            from: icoManager,
            gasPrice: gasPrice
        });
        let releaseGasCost = gasPrice.mul(releaseETHToStakeholder.receipt.gasUsed);
        let icoManagerBalanceAfterReleaseETH = await web3.eth.getBalance(icoManager);
        assert(icoManagerBalanceAfterReleaseETH.eq(icoManagerBalanceBeforeReleaseETH.plus(releaseEtherToStakeholderValue).minus(releaseGasCost)));

        await tokenLocal.approve(shareLocal.address, allowedValue, {
            from: icoManager
        });

        let allowance = await tokenLocal.allowance(icoManager, shareLocal.address);
        assert(allowance.eq(allowedValue));

        await shareLocal.acceptTokenFromICO(allowedValue, {
            from: icoManager
        });

        await shareLocal.setState(ST_TOKEN_DISTRIBUTION, {
            from: icoManager
        });

        let unusedBalance = await shareLocal.getStakeholderBalanceOf(RL_ICO_MANAGER);
        assert(unusedBalance.eq(totalSendValue.mul(stakeholderShare).div(1e18).minus(releaseEtherToStakeholderValue)));

        for (let i in account) {
            let poolingTokenBalance = await shareLocal.getBalanceTokenOf(account[i]);
            let poolingETHBalance = await shareLocal.getBalanceEtherOf(account[i]);
            let distributeETHValue = poolingETHBalance.divToInt(2);
            let distributeTokenValue = poolingTokenBalance.divToInt(2);
            let ethTx = await shareLocal.releaseEther(distributeETHValue, {
                from: account[i],
                gasPrice: gasPrice
            });
            let tokenTx = await shareLocal.releaseToken(distributeTokenValue, {
                from: account[i],
                gasPrice: gasPrice
            });
            distributeETHValues[i] = distributeETHValue;
            distributeETHFee[i] = gasPrice.mul(ethTx.receipt.gasUsed);
            distributeTokenValues[i] = distributeTokenValue;
            distributeTokenFee[i] = gasPrice.mul(tokenTx.receipt.gasUsed);
        }

        for (let i in account) {
            let balanceAfterDistribution = await web3.eth.getBalance(account[i]);
            assert(
                balanceAfterDistribution.eq(
                    initialBalance[i]
                        .minus(sendValue[i])
                        .minus(fee[i])
                        .plus(distributeETHValues[i])
                        .minus(distributeETHFee[i])
                        .minus(distributeTokenFee[i])
                )
            );
        }

        for (let i in account) {
            tokenBalance[i] = await tokenLocal.balanceOf(account[i]);
            let poolingTokenBalance = await shareLocal.getBalanceTokenOf(account[i]);
            assert(tokenBalance[i].eq(distributeTokenValues[i]));
            assert(
                poolingTokenBalance.eq(
                    sendValue[i]
                        .mul(allowedValue)
                        .divToInt(totalSendValue)
                        .minus(distributeTokenValues[i])
                )
            );
        }

        for (let i in account) {
            let tx = await shareLocal.sendTransaction({
                from: account[i],
                value: sendDestributionValue[i],
                gasPrice: gasPrice
            });
            destributionFee[i] = gasPrice.mul(tx.receipt.gasUsed);
        }

        for (let i in account) {
            let balanceAfterDistribution = await web3.eth.getBalance(account[i]);
            assert(
                balanceAfterDistribution.eq(
                    initialBalance[i]
                        .minus(sendValue[i])
                        .minus(fee[i])
                        .plus(distributeETHValues[i])
                        .minus(distributeETHFee[i])
                        .minus(distributeTokenFee[i])
                        .plus(
                            sendValue[i]
                                .mul(unusedBalance)
                                .divToInt(totalSendValue.mul(stakeholderShare).div(1e18))
                                .minus(distributeETHValues[i])
                        )
                        .minus(destributionFee[i])
                )
            )
        }

        for (let i in account) {
            tokenBalance[i] = await tokenLocal.balanceOf(account[i]);
            totalDestributedTokens = totalDestributedTokens.plus(tokenBalance[i]);
            assert(tokenBalance[i].eq(sendValue[i].mul(allowedValue).divToInt(totalSendValue)));
            let poolingTokenBalance = await shareLocal.getBalanceTokenOf(account[i]);
            assert(poolingTokenBalance.eq(0));
        }
    });

    it('should calculate money back', async function () {
        const admin = accounts[0];
        const poolManager = accounts[1];
        const icoManager = accounts[2];
        let tokenLocal = await Token.new(TOKEN_SUPPLY, {
            from: icoManager
        });
        let shareLocal = await ShareStoreTest.new(MINIMAL_DEPOSIT_SIZE, tokenLocal.address);
        await shareLocal.setRoleTestData(RL_POOL_MANAGER, poolManager);
        await shareLocal.setRoleTestData(RL_ICO_MANAGER, icoManager);
        await shareLocal.setState(ST_RAISING, {
            from: poolManager
        });

        let account = {
            account3: accounts[3],
            account4: accounts[4],
            account5: accounts[5],
            account6: accounts[6],
            account7: accounts[7],
            account8: accounts[8],
            account9: accounts[9]
        };

        let sendValue = {
            account3: tw(0.72134213423123),
            account4: tw(1.1111111111101),
            account5: tw(0.88888888888),
            account6: tw(0.05000000000001),
            account7: tw(0.999999999999999999),
            account8: tw(1.1),
            account9: tw(0.3454565433)
        };

        let sendMoneyBackValue = {
            account3: tw(0.6),
            account4: tw(1.1),
            account5: tw(0.777777777777),
            account6: tw(0.04),
            account7: tw(0.999999999),
            account8: tw(0.09191919199191919),
            account9: tw(0.061)
        };

        let sendMoneyBackAdminValue = {
            account3: tw(0.1),
            account4: tw(0.00001),
            account5: tw(0.1),
            account6: tw(0.01),
            account7: tw(0.0000000000000001),
            account8: tw(0.09191922219199191919),
            account9: tw(0.062123121)
        };

        let initialBalance = {};
        let fee = {};
        let moneyBackFee = {};
        let totalSendValue = tbn(0);

        for (let i in account)
            initialBalance[i] = await web3.eth.getBalance(account[i]);

        for (let i in account) {
            let tx = await shareLocal.buyShare({
                from: account[i],
                value: sendValue[i],
                gasPrice: gasPrice
            });
            totalSendValue = totalSendValue.plus(sendValue[i]);
            fee[i] = gasPrice.mul(tx.receipt.gasUsed);
        }

        for (let i in account) {
            let balance = await web3.eth.getBalance(account[i]);
            assert(balance.eq(initialBalance[i].minus(fee[i]).minus(sendValue[i])));
        }

        await shareLocal.setState(ST_MONEY_BACK, {
            from: poolManager
        });

        for (let i in account) {
            let tx = await shareLocal.refundShare(sendMoneyBackValue[i], {
                from: account[i],
                gasPrice: gasPrice
            });
            moneyBackFee[i] = gasPrice.mul(tx.receipt.gasUsed);
        }

        for (let i in account) {
            let balance = await web3.eth.getBalance(account[i]);
            assert(balance.eq(initialBalance[i].minus(sendValue[i]).minus(fee[i]).plus(sendMoneyBackValue[i]).minus(moneyBackFee[i])));
        }

        await shareLocal.setRoleTestData(RL_ADMIN, admin);
        for (let i in account) {
            let tx = await shareLocal.refundShareForce(account[i], sendMoneyBackAdminValue[i], {
                from: admin,
                gasPrice: gasPrice
            });
        }

        for (let i in account) {
            let balance = await web3.eth.getBalance(account[i]);
            assert(balance.eq(initialBalance[i].minus(sendValue[i]).minus(fee[i]).plus(sendMoneyBackValue[i]).plus(sendMoneyBackAdminValue[i]).minus(moneyBackFee[i])));
        }

        for (let i in account) {
            let tx = await shareLocal.sendTransaction({
                from: account[i],
                value: sendMoneyBackValue[i],
                gasPrice: gasPrice
            });
            moneyBackFee[i] = moneyBackFee[i].plus(gasPrice.mul(tx.receipt.gasUsed));
        }

        for (let i in account) {
            let balance = await web3.eth.getBalance(account[i]);
            assert(balance.eq(initialBalance[i].minus(fee[i]).minus(moneyBackFee[i])));
        }

        let totalShare = await shareLocal.totalShare();
        assert(totalShare.eq(0));
    });
});


contract('ShareStore OVERDRAFT TEST', (accounts) => {

    // const OVERDRAFT_SUM = tbn(Math.pow(2, 256));

    let payByAccounts = async (sum, pooling) => {
        let fees = [];
        fees.push(0);
        fees.push(0);
        fees.push(0);
        for (let i = 3; i < 10; i++) {
            let instance = (await pooling.sendTransaction({value: sum, gasPrice: gasPrice, from: accounts[i]}));
            fees.push(instance.receipt.gasUsed * gasPrice);
        }
        return fees;
    };

    it('should not work with overdraft sum when releaseEther', async function () {
        let tokenLocal = await Token.new(TOKEN_SUPPLY, {from: accounts[1]});
        let shareLocal = await ShareStoreTest.new(MINIMAL_DEPOSIT_SIZE, tokenLocal.address);
        await shareLocal.setRoleTestData(RL_POOL_MANAGER, accounts[0]);
        await shareLocal.setState(ST_RAISING, {from: accounts[0]});
        await payByAccounts(tw(1), shareLocal);
        let OVERDRAFT_SUM = await shareLocal.max_value_test();
        await shareLocal.setRoleTestData(RL_ICO_MANAGER, accounts[1]);
        await shareLocal.setState(ST_WAIT_FOR_ICO, {from: accounts[1]});
        await tokenLocal.approve(shareLocal.address, TOKEN_SUPPLY, {from: accounts[1]});
        let allowedTokens = await tokenLocal.allowance(accounts[1], shareLocal.address);
        await shareLocal.acceptTokenFromICO(allowedTokens, {from: accounts[1]});
        await shareLocal.setState(ST_TOKEN_DISTRIBUTION, {from: accounts[1]});
        assert(ST_TOKEN_DISTRIBUTION.eq(await shareLocal.getState()), "state error");

        let balanceBefore = await web3.eth.getBalance(accounts[4]);

        try {
           let i =  await shareLocal.releaseEther(OVERDRAFT_SUM, {from: accounts[4], gasPrice: gasPrice});
            console.log((i.receipt.gasUsed * gasPrice).toString());
        }
        catch (e) {
        }
        let balanceAfter = await web3.eth.getBalance(accounts[4]);
        assert(((balanceBefore)).gt(balanceAfter), " ether error");
    });

    it('should not work with overdraft sum when releaseToken', async function () {
        let tokenLocal = await Token.new(TOKEN_SUPPLY, {from: accounts[1]});
        let shareLocal = await ShareStoreTest.new(MINIMAL_DEPOSIT_SIZE, tokenLocal.address);
        await shareLocal.setRoleTestData(RL_POOL_MANAGER, accounts[0]);
        await shareLocal.setState(ST_RAISING, {from: accounts[0]});
        let OVERDRAFT_SUM = await shareLocal.max_value_test();
        await payByAccounts(tw(1), shareLocal);
        await shareLocal.setRoleTestData(RL_ICO_MANAGER, accounts[1]);
        await shareLocal.setState(ST_WAIT_FOR_ICO, {from: accounts[1]});
        await tokenLocal.approve(shareLocal.address, TOKEN_SUPPLY, {from: accounts[1]});
        let allowedTokens = await tokenLocal.allowance(accounts[1], shareLocal.address);
        await shareLocal.acceptTokenFromICO(allowedTokens, {from: accounts[1]});
        await shareLocal.setState(ST_TOKEN_DISTRIBUTION, {from: accounts[1]});
        assert(ST_TOKEN_DISTRIBUTION.eq(await shareLocal.getState()));

        let balanceBefore = await shareLocal.getBalanceTokenOf(accounts[4]);

        try {
            await shareLocal.releaseToken((OVERDRAFT_SUM), {from: accounts[4], gasPrice: gasPrice});
        }
        catch (e) {

        }

        let balanceAfter = await shareLocal.getBalanceTokenOf(accounts[4]);

        assert((balanceBefore).eq((balanceAfter)), " token error");
    });
    it('should not work with overdraft sum when acceptToken', async function () {
        let tokenLocal = await Token.new(TOKEN_SUPPLY, {from: accounts[1]});
        let shareLocal = await ShareStoreTest.new(MINIMAL_DEPOSIT_SIZE, tokenLocal.address);
        await shareLocal.setRoleTestData(RL_POOL_MANAGER, accounts[0]);
        await shareLocal.setState(ST_RAISING, {from: accounts[0]});
        let OVERDRAFT_SUM = await shareLocal.max_value_test();
        await payByAccounts(tw(1), shareLocal);
        await shareLocal.setRoleTestData(RL_ICO_MANAGER, accounts[1]);
        await shareLocal.setState(ST_WAIT_FOR_ICO, {from: accounts[1]});
        await tokenLocal.approve(shareLocal.address, TOKEN_SUPPLY, {from: accounts[1]});
        try {
            await shareLocal.acceptTokenFromICO(OVERDRAFT_SUM, {from: accounts[1]});
        } catch (e) {
        }

    });
    it('should not work with overdraft sum when refundShare', async function () {
        let tokenLocal = await Token.new(TOKEN_SUPPLY, {from: accounts[1]});
        let shareLocal = await ShareStoreTest.new(MINIMAL_DEPOSIT_SIZE, tokenLocal.address);
        await shareLocal.setRoleTestData(RL_POOL_MANAGER, accounts[0]);
        await shareLocal.setState(ST_RAISING, {from: accounts[0]});
        let OVERDRAFT_SUM = await shareLocal.max_value_test();
        await payByAccounts(tw(1), shareLocal);
        await shareLocal.setRoleTestData(RL_ICO_MANAGER, accounts[1]);
        await shareLocal.setState(ST_MONEY_BACK, {from: accounts[1]});
        try {
            await shareLocal.refundShare(OVERDRAFT_SUM, {from: accounts[4]});
        } catch (e) {
        }
    });
    it('should not work with overdraft sum when refundShareForce', async function () {
    });
    it('should not work with overdraft sum when realeseTokenForce', async function () {
    });
    it('should not work with overdraft sum when releaseEtherForce', async function () {
    });
});