const RoleModelTest = artifacts.require("./RoleModelTest.sol");

const web3 = global.web3;

const tbn = v => web3.toBigNumber(v);
const fbn = v => v.toString();
const tw = v => web3.toBigNumber(v).mul(1e18);
const fw = v => web3._extend.utils.fromWei(v).toString();

const RL_DEFAULT = tbn(0x00);
const RL_POOL_MANAGER = tbn(0x01);
const RL_ICO_MANAGER = tbn(0x02);
const RL_ADMIN = tbn(0x04);
const RL_PAYBOT = tbn(0x08);



contract('RoleModelTest ROLE TEST', (accounts) => {
    beforeEach(async function() {
      roleModelTest = await RoleModelTest.new({from: accounts[0]});
    });

    it("default role of contract creator should be RL_ADMIN", async function() {
        roleModelTest.setRole(RL_ADMIN, {from: accounts[0]});
        assert(RL_ADMIN.eq(await roleModelTest.getRole(accounts[0])));
    });

    it("RL_POOL_MANAGER role of contract should be setted properly", async function() {
        await roleModelTest.setRole(RL_POOL_MANAGER, {from: accounts[1]});
        assert(RL_POOL_MANAGER.eq(await roleModelTest.getRole(accounts[1])));
    });

    it("RL_ICO_MANAGER role of contract should be setted properly", async function() {
        await roleModelTest.setRole(RL_ICO_MANAGER, {from: accounts[2]});
        assert(RL_ICO_MANAGER.eq(await roleModelTest.getRole(accounts[2])));
    });

    it("RL_PAYBOT role of contract should be setted properly", async function() {
        await roleModelTest.setRole(RL_PAYBOT, {from: accounts[3]});
        assert(RL_PAYBOT.eq(await roleModelTest.getRole(accounts[3])));
    });

    it("RL_DEFAULT role of contract should be from any other accounts", async function() {
        
        for(let i = 4; i < 10; i++) 
        {
          assert(RL_DEFAULT.eq(await roleModelTest.getRole(accounts[i])));
        }
       
    });



    
})
