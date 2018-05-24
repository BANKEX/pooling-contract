const StateModelTest = artifacts.require("./StateModelTest.sol");

const web3 = global.web3;

const tbn = v => web3.toBigNumber(v);
const fbn = v => v.toString();
const tw = v => web3.toBigNumber(v).mul(1e18);
const fw = v => web3._extend.utils.fromWei(v).toString();


const TI_DAY = tbn(86400);

const ST_DEFAULT = tbn(0x00);
const ST_RAISING = tbn(0x01);
const ST_WAIT_FOR_ICO = tbn(0x02);
const ST_MONEY_BACK = tbn(0x04);
const ST_TOKEN_DISTRIBUTION = tbn(0x08);
const ST_FUND_DEPRECATED = tbn(0x10);

const RAISING_PERIOD = TI_DAY.mul(10);
const ICO_PERIOD = TI_DAY.mul(15);
const DISTRIBUTION_PERIOD = TI_DAY.mul(45);
const MINIMAL_FUND_SIZE = tw(100);
const MAXIMAL_FUND_SIZE = tw(100000);

const RL_DEFAULT = tbn(0x00);
const RL_POOL_MANAGER = tbn(0x01);
const RL_ICO_MANAGER = tbn(0x02);
const RL_ADMIN = tbn(0x04);
const RL_PAYBOT = tbn(0x08);


contract('StateModelTest', (accounts) => {
  beforeEach(async function() {
    stateModelTest = await StateModelTest.new(RAISING_PERIOD, ICO_PERIOD, DISTRIBUTION_PERIOD, MINIMAL_FUND_SIZE, MAXIMAL_FUND_SIZE);
  });

  it("default state should be ST_DEFAULT", async function() {
    assert(ST_DEFAULT.eq(await stateModelTest.getState()));
  });

  it("pool manager should be able to set state to ST_RAISING", async function() {
    await stateModelTest.setRole(RL_POOL_MANAGER);
    await stateModelTest.setState(ST_RAISING);
    assert(ST_RAISING.eq(await stateModelTest.getState()));
  });

  it("when pool is not collected during RAISING_PERIOD state should be ST_MONEY_BACK", async function() {
    await stateModelTest.setRole(RL_POOL_MANAGER);
    await stateModelTest.setState(ST_RAISING);
    await stateModelTest.setTotalEther(tw(10));
    await stateModelTest.incTimestamp(RAISING_PERIOD);
    assert(ST_MONEY_BACK.eq(await stateModelTest.getState()));
  });
 

  
});