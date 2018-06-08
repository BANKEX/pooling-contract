

var PoolProd = artifacts.require("./PoolProd.sol");



const tbn = v => web3._extend.utils.toBigNumber(v);
const fbn = v => v.toString();
const tw = v => web3._extend.utils.toBigNumber(v).mul(1e18);
const fw = v => web3._extend.utils.fromWei(v).toString();

const TOKEN_SUPPLY = tw(10);
const MINIMAL_DEPOSIT_SIZE = tw(0.05)

const TI_DAY = tbn(86400);




module.exports = function(deployer, network, accounts) {
  const operator = accounts[0];
  const RAISING_PERIOD = TI_DAY.mul(10);
  const ICO_PERIOD = TI_DAY.mul(15);
  const DISTRIBUTION_PERIOD = TI_DAY.mul(36524);
  const MINIMAL_FUND_SIZE = tw(10);
  const MAXIMAL_FUND_SIZE = tw(10000);
  const MINIMAL_DEPOSIT = tw(1);
  const ADMIN_SHARE = tw(0.01);
  const POOL_MANAGER_SHARE = tw(0.04);
  const POOL_MANAGER_ADDRESS = accounts[7];
  const ICO_MANAGER_ADDRESS = accounts[8];
  const PAYBOT_ADDRESS = accounts[9];
  const TOKEN_ADDRESS = '0x15d16cf1620f924d77B302f5CEf75Ee9816B672F';




  (async () => {
    console.log(JSON.stringify([RAISING_PERIOD, ICO_PERIOD, DISTRIBUTION_PERIOD, 
      MINIMAL_FUND_SIZE, MAXIMAL_FUND_SIZE, MINIMAL_DEPOSIT, 
      ADMIN_SHARE, POOL_MANAGER_SHARE, 
      POOL_MANAGER_ADDRESS, ICO_MANAGER_ADDRESS, PAYBOT_ADDRESS].map(x=>x.toString())))

    await deployer.deploy(PoolProd, 
      RAISING_PERIOD, ICO_PERIOD, DISTRIBUTION_PERIOD, 
      MINIMAL_FUND_SIZE, MAXIMAL_FUND_SIZE, MINIMAL_DEPOSIT, 
      ADMIN_SHARE, POOL_MANAGER_SHARE, 
      POOL_MANAGER_ADDRESS, ICO_MANAGER_ADDRESS, PAYBOT_ADDRESS, TOKEN_ADDRESS,
      {from:operator});
    await PoolProd.deployed();

  })();
};
