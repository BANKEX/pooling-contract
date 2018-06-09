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
const ICO_MANAGER_RELEASE_ETH = tw(2);
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

    const investors = {
        account4: accounts[4],
        account5: accounts[5],
        account6: accounts[6],
        account7: accounts[7],
        account8: accounts[8]
    }

    let pool;
    let token;

    const resetBeforeTest = async function () {
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

    describe('Role Tests', function () {

        it('check that ADMIN account has role RL_ADMIN', async function () {
            assert(
                (await pool.getRole(ADMIN)).eq(RL_ADMIN),
                " admin role error"
            );
        });

        it('check that ICO_MANAGER account has role RL_ICO_MANAGER', async function () {
            assert(
                (await pool.getRole(ICO_MANAGER)).eq(RL_ICO_MANAGER),
                "ico manager role error"
            );
        });

        it('check that PAY_BOT account has role RL_PAYBOT', async function () {
            assert(
                (await pool.getRole(PAYBOT)).eq(RL_PAYBOT),
                "pay bot role error"
            );
        });

        it('check that POOL_MANAGER account has role RL_POOL_MANAGER', async function () {
            assert(
                (await pool.getRole(POOL_MANAGER)).eq(RL_POOL_MANAGER),
                "pool manager role error"
            );
        });
    });

    describe('Store Tests', function () {

        it('should allow to release tokens to investors', async function () {
            await pool.setState(ST_RAISING, {
                from: POOL_MANAGER
            });
            assert(ST_RAISING.eq(await pool.getState()));

            for (let i in investors)
                await pool.sendTransaction({
                    value: INVESTOR_SUM_PAY,
                    from: investors[i]
                });

            let totalSendETH = await pool.totalShare();

            await pool.setState(ST_WAIT_FOR_ICO, {
                from: ICO_MANAGER
            });
            let balBefore = await web3.eth.getBalance(ICO_MANAGER);
            let allowedBalance = await pool.getStakeholderBalanceOf(RL_ICO_MANAGER);
            let instance = await pool.releaseEtherToStakeholder(allowedBalance, {
                from: ICO_MANAGER,
                gasPrice: gasPrice
            });
            let gasCost = gasPrice.mul(instance.receipt.gasUsed);
            let balAfter = await web3.eth.getBalance(ICO_MANAGER);
            assert(balBefore.eq((balAfter.minus(allowedBalance)).plus(gasCost)));

            await token.approve(pool.address, TOKEN_SUPPLY, {
                from: ICO_MANAGER
            });
            let allowedTokens = await token.allowance(ICO_MANAGER, pool.address);
            assert(allowedTokens.eq(TOKEN_SUPPLY));
            await pool.acceptTokenFromICO(allowedTokens, {
                from: ICO_MANAGER
            });
            let contractBalance = await token.balanceOf(pool.address);
            assert(TOKEN_SUPPLY.eq(contractBalance));

            await pool.setState(ST_TOKEN_DISTRIBUTION, {
                from: ADMIN
            });
            assert(ST_TOKEN_DISTRIBUTION.eq(await pool.getState()));

            for (let i in investors) {
                let poolingTokenBalance = await pool.getBalanceTokenOf(investors[i]);
                assert(poolingTokenBalance.eq(INVESTOR_SUM_PAY.mul(allowedTokens).div(totalSendETH)));
                await pool.releaseToken(poolingTokenBalance, {
                    from: investors[i],
                    gasPrice: gasPrice
                });
                let erc20TokenBalance = await token.balanceOf(investors[i]);
                assert(poolingTokenBalance.eq(erc20TokenBalance));
            }
        });

        it('should allow to release remaining ETH to investors', async function () {
            await pool.setState(ST_RAISING, {
                from: POOL_MANAGER
            });
            assert(ST_RAISING.eq(await pool.getState()));

            for (let i in investors)
                await pool.sendTransaction({
                    value: INVESTOR_SUM_PAY,
                    from: investors[i]
                });

            let totalSendETH = await pool.totalShare();

            await pool.setState(ST_WAIT_FOR_ICO, {
                from: ICO_MANAGER
            });

            let balBefore = await web3.eth.getBalance(ICO_MANAGER);
            let allowedBalance = await pool.getStakeholderBalanceOf(RL_ICO_MANAGER);
            let icoManagerPersentageShare = await pool.stakeholderShare(2);
            let icoManagerETHShare = totalSendETH.mul(icoManagerPersentageShare).divToInt(1e18);
            assert(allowedBalance.eq(icoManagerETHShare));
            let instance = await pool.releaseEtherToStakeholder(ICO_MANAGER_RELEASE_ETH, {
                from: ICO_MANAGER,
                gasPrice: gasPrice
            });
            let gasCost = gasPrice.mul(instance.receipt.gasUsed);
            let balAfter = await web3.eth.getBalance(ICO_MANAGER);
            assert(balAfter.eq((balBefore.plus(ICO_MANAGER_RELEASE_ETH)).minus(gasCost)));

            await token.approve(pool.address, TOKEN_SUPPLY, {
                from: ICO_MANAGER
            });
            let allowedTokens = await token.allowance(ICO_MANAGER, pool.address);
            assert(allowedTokens.eq(TOKEN_SUPPLY));
            await pool.acceptTokenFromICO(allowedTokens, {
                from: ICO_MANAGER
            });
            let contractBalance = await token.balanceOf(pool.address);
            assert(TOKEN_SUPPLY.eq(contractBalance));

            await pool.setState(ST_TOKEN_DISTRIBUTION, {
                from: ADMIN
            });
            assert(ST_TOKEN_DISTRIBUTION.eq(await pool.getState()));

            for (let i in investors) {
                // Ниже неправильный BigNumber: BigNumber { s: 1, e: 16, c: [ 999, 99999999999998 ] }
                // Если делать транзакцию - воспринимает только такой формат
                let poolingETHBalance = await pool.getBalanceEtherOf(investors[i]);
                let investorBalanceBefore = await web3.eth.getBalance(investors[i]);
                console.log(poolingETHBalance)
                console.log((totalSendETH.minus(ICO_MANAGER_RELEASE_ETH)).mul(INVESTOR_SUM_PAY).div(totalSendETH))
                // assert(poolingETHBalance.eq((totalSendETH.minus(ICO_MANAGER_RELEASE_ETH)).div(totalSendETH).mul(INVESTOR_SUM_PAY)));
                let tx = await pool.releaseEther(poolingETHBalance, {
                    from: investors[i],
                    gasPrice: gasPrice
                });
                let gasCost = gasPrice.mul(tx.receipt.gasUsed);
                let investorBalanceAfter = await web3.eth.getBalance(investors[i]);
                assert(investorBalanceAfter.eq(investorBalanceBefore.plus(poolingETHBalance).minus(gasCost)));
            }
        });
    });
});