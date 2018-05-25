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

const MINIMAL_FUND_SIZE = tw(100);
const MAXIMAL_FUND_SIZE = tw(100000);

const INVESTOR_SUM_PAY = tw(0.5);
const INVESTOR_SUM_TO_TRIGGER = tw(0.00001);

const RL_DEFAULT = tbn(0x00);
const RL_POOL_MANAGER = tbn(0x01);
const RL_ICO_MANAGER = tbn(0x02);
const RL_ADMIN = tbn(0x04);
const RL_PAYBOT = tbn(0x08);

contract('ShareStore COMMON TEST', (accounts) => {
    
    it("Token address must be tokenLocal.address", async function() {
      let tokenLocal = await Token.new(TOKEN_SUPPLY);
      console.log(tokenLocal.address);
      let shareLocal = await ShareStoreTest.new(MINIMAL_DEPOSIT_SIZE, tokenLocal.address, {gasPrice: 1, gasLimit: tw(10)});
      console.log(shareLocal.address);
      await shareLocal.setState(ST_RAISING);
    });

})