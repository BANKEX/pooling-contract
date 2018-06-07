const Pool = artifacts.require("./PoolTest.sol");
const Token = artifacts.require("./TestToken.sol");

const web3 = global.web3;

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

const ADMIN_SHARE = tbn(1);
const POOL_MANAGER_SHARE = tbn(4);

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

contract('Pool Common test', function (accounts) {

    const ADMIN = accounts[0];
    const POOL_MANAGER = accounts[1];
    const PAYBOT = accounts[2];
    const ICO_MANAGER = accounts[3];

    let pool;
    let token;

    const resetBeforeTest = async function () {
        token = await Token.new(
            TOKEN_SUPPLY,
            {from: ICO_MANAGER}
        );
        pool = await Pool.new(
            RAISING_PERIOD, ICO_PERIOD, DISTRIBUTION_PERIOD,
            MINIMAL_FUND_SIZE, MAXIMAL_FUND_SIZE, MINIMAL_DEPOSIT_SIZE,
            ADMIN_SHARE, POOL_MANAGER_SHARE,
            POOL_MANAGER, ICO_MANAGER, PAYBOT,
            token.address,
            {from: ADMIN}
        );
    };

    beforeEach(resetBeforeTest);

    describe('Role Tests', function () {

        it(' check that ADMIN account has role RL_ADMIN', async function () {
            assert(
                (await pool.getRole(ADMIN)).eq(RL_ADMIN),
                " admin role error"
            );
        });

    });

    describe('Store Tests', function () {

        it('should allow to release tokens to investors', async function () {
            resetBeforeTest();
            await pool.setState(ST_RAISING, {from: POOL_MANAGER});
            assert(ST_RAISING.eq(await pool.getState()));

            await pool.sendTransaction({value: tw(1), from: accounts[4]});
            await pool.sendTransaction({value: tw(1), from: accounts[5]});
            await pool.sendTransaction({value: tw(1), from: accounts[6]});
            // more than 3 transactions make revert

            // await pool.sendTransaction({value: tw(1), from: accounts[7]});
            // await pool.sendTransaction({value: tw(1), from: accounts[8]});
            // await pool.sendTransaction({value: tw(1), from: accounts[9]});
            // await pool.sendTransaction({value: tw(1), from: accounts[10]});

            // for (let i = 7; i < 10; i++) {
            //     await pool.sendTransaction({value: tw(1), from: accounts[i]});
            // }
            // for (let i = 4; i < 9; i++) {
            //     await pool.sendTransaction({value: tw(1), from: accounts[i]});
            // }
            // await pool.setState(ST_WAIT_FOR_ICO, {from: ICO_MANAGER});
            // let balBefore = await web3.eth.getBalance(ICO_MANAGER);
            // let allowedBalance = await pool.getStakeholderBalanceOf(RL_ICO_MANAGER);
            // let instance = await pool.releaseEtherToStakeholder(allowedBalance, {
            //     from: ICO_MANAGER,
            //     gasPrice: gasPrice
            // });
            // let gasUsed = instance.receipt.gasUsed;
            // let transactionCost = gasUsed.mul(gasPrice);
            // let balAfter = (await web3.eth.getBalance(ICO_MANAGER));
            // assert(balBefore.eq((balAfter.minus(allowedBalance)).plus(transactionCost)));
            //
            // await token.approve(shareLocal.address, TOKEN_SUPPLY, {from: ICO_MANAGER});
            // let allowedTokens = await token.allowance(ICO_MANAGER, pool.address);
            // await pool.acceptTokenFromICO(allowedTokens);
            // await pool.setState(ST_TOKEN_DISTRIBUTION, {from: ADMIN});
            // let tokenBalance = await pool.getBalanceTokenOf(accounts[4]);
            // await pool.releaseToken(tokenBalance, {from: accounts[4]});
            // assert(tokenBalance.eq(await token.balanceOf(accounts[4])));
        });

    });
});