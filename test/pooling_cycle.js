const web3 = global.web3;
const MintableToken = artifacts.require("./token/ERC20/MintableToken.sol");
const Pool = artifacts.require('./Pool.sol');
const tw = v=>web3.toBigNumber(v).mul(1e18);
const fw = v=>web3._extend.utils.fromWei(v).toString();

// contract('Pool', (accounts) => {
//     it("it should full-cycle test", async function() {

//     })
// });