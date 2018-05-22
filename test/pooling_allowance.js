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

    it("should allow all ivestors to return money back from smart contract after STATE money back", async function() {
        const gasPrice = tw("3e-7");
        // two new contracts and pool mng ico mng token target init
        let mnt = await MintableToken.new({from: accounts[1]});
        let pool = await Pool.new({from: accounts[0]});
        await pool.setICOManager(accounts[1], { from: accounts[0], gasPrice: gasPrice });
        await pool.setPoolManager(accounts[2], { from: accounts[0], gasPrice: gasPrice });
        await pool.setTargetToken(mnt.address, { from: accounts[0], gasPrice: gasPrice });
        assert.equal(await pool.poolManager(), accounts[2], "pool manager address error ");
        await pool.startRaising({from: accounts[2], gasPrice: gasPrice});
        assert.equal(await pool.poolState(), 1, "state error ");
         // two new contracts and pool mng ico mng token target init

        var investorsBalanceBeforePay = [];
        investorsBalanceBeforePay.push(0);
        investorsBalanceBeforePay.push(0);
        investorsBalanceBeforePay.push(0);
        

        var gasweiTx;
        
   
        for(let i = 3; i < 10; i++) {

        investorsBalanceBeforePay.push((await web3.eth.getBalance(accounts[i])))

        }

        let usum = 0.1;

        let sum = tw(usum);

        var txs = []; // usedGas of every tx after first pay 
        txs.push(0);
        txs.push(0);
        txs.push(0);

        for(let i = 3; i < 10; i++) {

        let tx = (await pool.pay({value: (sum), from: accounts[i], gasPrice: gasPrice}))

        let usedGas = tx.receipt.gasUsed;

        txs.push(usedGas);

        }

        var balancesAfterFirstPay = []; // balances of accounts after first pay
        balancesAfterFirstPay.push(0);
        balancesAfterFirstPay.push(0);
        balancesAfterFirstPay.push(0);

        var returnedEth = []; // balances of accounts after first pay from Account Pooling 
        returnedEth.push(0);
        returnedEth.push(0);
        returnedEth.push(0);
        
        for(let i = 3; i < 10; i++) {

            let usedAm = txs[i];

            let used = gasPrice.mul(usedAm);

            let balanceNow = (await web3.eth.getBalance(accounts[i]));

            let nowPlusAll = ((balanceNow).plus(used).plus( (sum) ));

            balancesAfterFirstPay.push(balanceNow);

            assert( (investorsBalanceBeforePay[i]).eq(nowPlusAll), "error of balances" );

            returnedEth.push(await pool.getETHBalance({from: accounts[i]}));
        }

        await pool.startMoneyBack({from: accounts[0]});       

        let sumBack = tw(0.0001);

        var txsB = []; // amount of used gas after second pay
        txsB.push(0);
        txsB.push(0);
        txsB.push(0);

        for(let i = 3; i < 10; i++) {
        
        let tx;
        try {
            tx = (await pool.pay({value: (sumBack), from: accounts[i], gasPrice: gasPrice}))
        }
        catch (error) {
            console.log(error)
        }

        let gasUsed = tx.receipt.gasUsed;

        txsB.push(gasUsed);

        }

        for(let i = 3; i < 10; i++) {

            let allGasUsed = txs[i] + txsB[i];

            let transactionsFee = (allGasUsed).mul(gasPrice);

            let sumPlusFeesOfStateHolders = tw(0.1 * 1.08);

            let balanceNow = (await web3.eth.getBalance());

            let blanceBefore = investorsBalanceBeforePay[i];



            assert(balanceNow.eq(blanceBefore.plus(transactionsFee.plus(sumPlusFeesOfStateHolders))));
         

        }
        
        
    
    })
    

})

