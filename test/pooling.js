const web3 = global.web3;
const StandardToken = artifacts.require("./token/ERC20/StandardToken.sol");
const Pool = artifacts.require("./pooling.sol");
const tw = v=>web3.toBigNumber(v).mul(1e18);
const fw = v=>web3._extend.utils.fromWei(v).toString();

contract('Pool', (accounts) => {

    //initial params for testing

    beforeEach(async function() {
        stndTkn = await StandardToken.new();
        pool = await pooling.new();
    });

    // it("admin of pool is accounts[0]", async function() {
    //     assert.equal(await pool.owner(), accounts[0]);
    // })
})