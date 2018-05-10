const web3 = global.web3;
const MintableToken = artifacts.require("./token/ERC20/MintableToken.sol");
const Pool = artifacts.require('./Pool.sol');
const tw = v=>web3.toBigNumber(v).mul(1e18);
const fw = v=>web3._extend.utils.fromWei(v).toString();

contract('Pool', (accounts) => {

    //initial params for testing

    // beforeEach(async function() {
       
    // });


    //setManager()

    it("shouldn't allow to set ICO manager from not contract owner, admin of pool is accounts[0], ICO manager is accounts[1]", async function() {
        
        let mnt = await MintableToken.new({from: accounts[1]});
        let pool = await Pool.new({from: accounts[0]});

        try { 
            await pool.setManager(accounts[1], { from: accounts[2] });
        } 
        catch (error) {}

        assert.notEqual(await pool.icoManager(), accounts[1], "ico manager error when not equal 28");

        try { 
            await pool.setManager(accounts[1], { from: accounts[0] });
        } 
        catch (error) {
            console.log(error);  
        }

        assert.equal(await pool.owner(), accounts[0], "pooling owner error 37");
        assert.equal(await mnt.owner(), accounts[1], "mnt owner error 38");
        assert.equal(await pool.icoManager(), accounts[1], "ico manager error 39");

        for (let i = 2; i < 9; i++) {
            assert.notEqual((await pool.owner(), accounts[i], "pooling owner error 42"));
            assert.notEqual(await mnt.owner(), accounts[i], "mnt owner error 43");
            assert.notEqual(await pool.icoManager(), accounts[i], "ico manager error 44");
        }

    })

    //setManager() && setTargetToken()
    
    it("should allow to set target token by ICO manager", async function() {

        let mnt = await MintableToken.new({from: accounts[1]});
        let pool = await Pool.new({from: accounts[0]});

        try { 
            await pool.setManager(accounts[1], { from: accounts[0] });
        } 
        catch (error) {}

        try { 
            await pool.setTargetToken(mnt.address, { from: accounts[0] });
        } 
        catch (error) {}

        assert.equal(await pool.targetToken(), mnt.address, "targetToken error 66");


    })

    //allow pool manager to set raising peroid

    it("should allow anybody to send eth and become an investor", async function(){
        
        let mnt = await MintableToken.new({from: accounts[1]});
        let pool = await Pool.new({from: accounts[0]});

        await pool.setManager(accounts[1], { from: accounts[0] });
        await pool.setTargetToken(mnt.address, { from: accounts[0] });

        assert.equal(await pool.poolManager(), await pool.owner(), "pool manager address error 81");

        try { 
            await pool.startRasing();
        } 
        catch (error) {
            console.log(error);
        }
       
        assert.equal(await pool.poolState(), 1, "state error 91");

       

        for(let i = 2; i <= 9; i++) {

            try { 
                await pool.pay({ value: (3e18/7), from: accounts[i]});
            } 
            catch (error) {
                console.log(error);
            }
            console.log( (await pool.totalAcceptedETH()).toNumber() );

            assert.notEqual(await pool.totalAcceptedETH(), , "balance error 101")

        }



    })

})
