const web3 = global.web3;
const MintableToken = artifacts.require("./token/ERC20/MintableToken.sol");
const Pool = artifacts.require('./Pool.sol');
const tw = v=>web3.toBigNumber(v).mul(1e18);
const fw = v=>web3._extend.utils.fromWei(v).toString();

contract('Pool', (accounts) => {

    // beforeEach(async function() {
       
    // });

    it("shouldn't allow to set ICO manager && Pool manager from not contract owner, admin  is accounts[0], ICO manager is accounts[1]", async function() {
        
        let mnt = await MintableToken.new({from: accounts[1]});
        let pool = await Pool.new({from: accounts[0]});

        try { 
            await pool.setICOManager(accounts[1], { from: accounts[2] });
            await pool.setPoolManager(accounts[2], { from: accounts[2] });
        } 
        catch (error) {}

        assert.notEqual(await pool.icoManager(), accounts[1], "ico manager error when not equal 28");
        assert.notEqual(await pool.poolManager(), accounts[2], "pool manager error when not equal 28");

        try { 
            await pool.setICOManager(accounts[1], { from: accounts[0] });
            await pool.setPoolManager(accounts[2], { from: accounts[0] });
        } 
        catch (error) {
            console.log(error);  
        }

        assert.equal(await pool.owner(), accounts[0], "pooling owner error 37");
        assert.equal(await mnt.owner(), accounts[1], "mnt owner error 38");
        assert.equal(await pool.icoManager(), accounts[1], "ico manager error 39");
        assert.equal(await pool.poolManager(), accounts[2], "pool manager error 39");

        for (let i = 3; i < 9; i++) {
            assert.notEqual((await pool.owner(), accounts[i], "pooling owner error 42"));
            assert.notEqual(await mnt.owner(), accounts[i], "mnt owner error 43");
            assert.notEqual(await pool.icoManager(), accounts[i], "ico manager error 44");
        }

    })
    
    it("should allow to set target token by ICO manager", async function() {

        let mnt = await MintableToken.new({from: accounts[1]});
        let pool = await Pool.new({from: accounts[0]});

        try { 
            await pool.setICOManager(accounts[1], { from: accounts[0] });
            await pool.setPoolManager(accounts[2], { from: accounts[0] });
        } 
        catch (error) {}
        
        for(let i = 2; i <= 9; i++) {
            try { 
                await pool.setTargetToken(mnt.address, { from: accounts[i] });
            } 
            catch (error) {}
        }
        try { 
            await pool.setTargetToken(mnt.address, { from: accounts[0] });
        } 
        catch (error) {}

        assert.equal(await pool.targetToken(), mnt.address, "targetToken error 72");


    })

    it("should allow anybody to send eth and become an investor", async function(){
        
        let mnt = await MintableToken.new({from: accounts[1]});
        let pool = await Pool.new({from: accounts[0]});

        await pool.setICOManager(accounts[1], { from: accounts[0] });
        await pool.setPoolManager(accounts[2], { from: accounts[0] });
        await pool.setTargetToken(mnt.address, { from: accounts[0] });

        assert.equal(await pool.poolManager(), accounts[2], "pool manager address error 87");

        try { 
            await pool.startRaising({from: accounts[2]});
        } 
        catch (error) {
            console.log(error);
        }
       
        assert.equal(await pool.poolState(), 1, "state error 96");

        for(let i = 3; i <= 9; i++) {

            let sum = tw(0.1);


            try { 
                await pool.pay({ value: (sum), from: accounts[i]});
            } 
            catch (error) {
                console.log(error);
            }
            
            let balanceOfPoolingContract =  (await web3.eth.getBalance(pool.address));


            // let portions = ((await pool.poolManagerPortion()).plus(await pool.adminPortion()));
            // let totalpluport = (await pool.totalAcceptedETH()).plus(portions);
            // let bal = (await web3.eth.getBalance(pool.address));

            // let invBal = (await pool.investorSum([accounts[i]]));

            // let percentParPoolMng = (await pool.percentPoolManager());
      
            // let percentParAdmin = (await pool.percentAdmin());

            // let fixedPartPoolMng = (percentParPoolMng).mul(sum);

            // let fixedprtAdmin = (percentParAdmin).mul(sum);

            // let allPrtsFixed = ((fixedPartPoolMng).plus((fixedprtAdmin)))/100;

            // console.log(invBal.toString());
            // console.log(((invBal).minus((sum).minus(allPrtsFixed))).toString());
            // console.log((allPrtsFixed).toString());

            // assert( (invBal).eq( (sum).minus(allPrtsFixed) ), "investor's balance error" );
            // assert( (totalpluport).eq(bal), "balance error 135");   
        }

        
    })

    it("should allow only pool manager to start rasing period", async function(){ 

        let mnt = await MintableToken.new({from: accounts[1]});
        let pool = await Pool.new({from: accounts[0]});

        await pool.setICOManager(accounts[1], { from: accounts[0] });
        await pool.setPoolManager(accounts[2], { from: accounts[0] });
        await pool.setTargetToken(mnt.address, { from: accounts[0] });

        assert.equal(await pool.poolManager(), accounts[2], "pool manager address error 87");

        try { 
            await pool.startRaising({from: accounts[2]});
        } 
        catch (error) {
            console.log(error);
        }
       
        assert.equal(await pool.poolState(), 1, "state error 96");

        try {
            for(let i = 3; i < 10; i++) {
                await pool.startRaising({from: accounts[i]});
                assert.equal(await pool.poolState(), 0, "state error");
            }
            for(let i = 0; i < 2; i++) {
                await pool.startRaising({from: accounts[i]});
                assert.equal(await pool.poolState(), 0, "state error");
            }
           
        }
        catch (error) {}
    })

    it("should allow anybody from state holders pool or admin to set state moneyback after raising", async function() {
        let mnt = await MintableToken.new({from: accounts[1]});
        let pool = await Pool.new({from: accounts[0]});

        await pool.setICOManager(accounts[1], { from: accounts[0] });
        await pool.setPoolManager(accounts[2], { from: accounts[0] });
        await pool.setTargetToken(mnt.address, { from: accounts[0] });

        assert.equal(await pool.poolManager(), accounts[2], "pool manager address error 87");

        try { 
            await pool.startRaising({from: accounts[2]});
        } 
        catch (error) {
            console.log(error);
        }
       
        assert.equal(await pool.poolState(), 1, "state error 96");

        
        
        try { 
            await pool.startMoneyBack({from: accounts[0]});
        } 
        catch (error) {
            console.log(error);
        }

        assert.equal(await pool.poolState(), 3, "state error 96");


        let mnt2 = await MintableToken.new({from: accounts[1]});
        let pool2 = await Pool.new({from: accounts[0]});

        await pool2.setICOManager(accounts[1], { from: accounts[0] });
        await pool2.setPoolManager(accounts[2], { from: accounts[0] });
        await pool2.setTargetToken(mnt2.address, { from: accounts[0] });

        assert.equal(await pool2.poolManager(), accounts[2], "pool manager address error 87");

        try { 
            await pool2.startRaising({from: accounts[2]});
        } 
        catch (error) {
            console.log(error);
        }
       
        assert.equal(await pool2.poolState(), 1, "state error 96");

        try { 
            await pool2.startMoneyBack({from: accounts[2]});
        } 
        catch (error) {
            console.log(error);
        }

        assert.equal(await pool2.poolState(), 3, "state error 96");

        //


        let mnt3= await MintableToken.new({from: accounts[1]});
        let pool3= await Pool.new({from: accounts[0]});

        await pool3.setICOManager(accounts[1], { from: accounts[0] });
        await pool3.setPoolManager(accounts[2], { from: accounts[0] });
        await pool3.setTargetToken(mnt3.address, { from: accounts[0] });

        assert.equal(await pool3.poolManager(), accounts[2], "pool manager address error 87");

        try { 
            await pool3.startRaising({from: accounts[2]});
        } 
        catch (error) {
            console.log(error);
        }
       
        assert.equal(await pool3.poolState(), 1, "state error ");

        try { 
            await pool3.startMoneyBack({from: accounts[1]});
        } 
        catch (error) {}

        assert.notEqual(await pool3.poolState(), 3, "state error ");


    })
    
    it('should allow all ivestors to return money back from smart contract after STATE money back', async function() {

        const gasPrice = tw("3e-7");
        let mnt = await MintableToken.new({from: accounts[1]});
        let pool = await Pool.new({from: accounts[0]});
        await pool.setICOManager(accounts[1], { from: accounts[0], gasPrice: gasPrice });
        await pool.setPoolManager(accounts[2], { from: accounts[0], gasPrice: gasPrice });
        await pool.setTargetToken(mnt.address, { from: accounts[0], gasPrice: gasPrice });
        assert.equal(await pool.poolManager(), accounts[2], "pool manager address error ");
        await pool.startRaising({from: accounts[2], gasPrice: gasPrice});

        assert.equal(await pool.poolState(), 1, "state error ");
        
        
        // 7 accounts

        let bBefore = []; // balances before rasing

        let bAfterFirst = []; // balances before moneyback after rasing

        let bAfterSecond = []; // balances after money back

        let txsOne = []; // amount of gas for first pay

        let txsTwo = []; // amount of gas for second pay

        let feeOne = []; // fee for first pay

        let feeTwo = []; // fee for second pay

        let sum = tw(0.2); // sum for pay

        // fast solution
        bBefore.push(0);
        bBefore.push(0);
        bBefore.push(0);
        bAfterFirst.push(0);
        bAfterFirst.push(0);
        bAfterFirst.push(0);
        bAfterSecond.push(0);
        bAfterSecond.push(0);
        bAfterSecond.push(0);
        txsOne.push(0);
        txsOne.push(0);
        txsOne.push(0);
        txsTwo.push(0);
        txsTwo.push(0);
        txsTwo.push(0);
        feeOne.push(0);
        feeOne.push(0);
        feeOne.push(0);
        feeTwo.push(0);
        feeTwo.push(0);
        feeTwo.push(0);
        
        // balances after first pay
        for(let i = 3; i < 10; i++) { bBefore.push(await web3.eth.getBalance(accounts[i])) }

        // pay first
        for(let i = 3; i < 10; i++) {
            let instanse = (await pool.pay({value: sum, from: accounts[i], gasPrice: gasPrice}));
            txsOne.push(instanse.receipt.gasUsed);
            feeOne.push(txsOne[i] * gasPrice);
        }

        // balances after first pay
        for(let i = 3; i < 10; i++) { bAfterFirst.push(await web3.eth.getBalance(accounts[i])) }

        // asset first pay
        for(let i = 3; i < 10; i++) { 
            assert((bBefore[i]).eq((bAfterFirst[i]).plus( (sum).plus(feeOne[i]))), "balances error after raisisng");
        }

        // state money back
        await pool.startMoneyBack({from: accounts[0], gasPrice: gasPrice});

        // pay second
        for(let i = 3; i < 10; i++) {
        let instanse = (await pool.pay({value: sum, from: accounts[i], gasPrice: gasPrice}));
        txsTwo.push(instanse.receipt.gasUsed);
        feeTwo.push(txsTwo[i] * gasPrice);
        }

        // balances after second pay
        for(let i = 3; i < 10; i++) { bAfterSecond.push(await web3.eth.getBalance(accounts[i])) }

        // assert after second
        for(let i = 3; i < 10; i++) { 
            assert((bBefore[i]).eq((bAfterSecond[i]).plus(feeOne[i]+feeTwo[i])), "error after money back in balance");
        }

        // another assert after second 
        // mapping (address => uint256) public investorSum; must be public
        // mapping (address => uint256) public investorSum; later must be internal
        // i want to test internal logic of contract here
        for(let i = 3; i < 10; i++) { 
            assert((bAfterSecond[i]).eq(((await pool.investorSum(accounts[i]) ).plus((bAfterFirst[i]))).minus(feeTwo[i])), "error 2 after money back in balance");
        }   
    })
    

})

