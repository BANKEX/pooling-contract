pragma solidity ^0.4.21;
import "../ownership/Ownable.sol";
import "../math/SafeMath.sol";
import "../token/ERC20/ERC20.sol";

contract IPoolVar is Ownable {

  uint8 constant STATE_DEFAULT = 0;
  uint8 constant STATE_RAISING = 1;
  uint8 constant STATE_WAIT_FOR_ICO = 2;
  uint8 constant STATE_MONEY_BACK = 3;
  uint8 constant STATE_TOKENS_DISTRIBUTION = 4;
  uint8 constant STATE_FUND_DEPRECATED = 0xFF;

  /**
  * @dev address of Pool manager
  */
  address public poolManager;

  /**
  * @dev address of ICO manager
  */
  address public icoManager;

  /**
  * @dev address of Admin BANKEX
  */
  address public owner;

  /**
  * @dev address of ICO ERC20 Token
  */
  address public targetToken;
  
  /**
  * @dev minimal amount of ETH which investor can send to contract via payable function
  */
  uint256 public minimalDeposit;

  /**
  * @dev minimal amount of ETH which allows to make ICO distribution
  */
  uint256 public minimalFundSize;

  /**
  * @dev max amount of ETH which allows to make ICO distribution
  */
  uint256 public maximalFundSize;
  
  /**
  * @dev amount of time UNIX which needed to make a raising for ICO (Deadline)
  */
  uint256 public rasingTime;

  /**
  * @dev amount of time UNIX which needed to send tokens to investors and allow to send tokens to investor (Deadline)
  */
  uint256 public icoTime;

  /**
  * @dev amount of time UNIX when fund will become depricated (Deadline)
  */
  uint256 public fundDeprecatedTime;
  
  /**
  * @dev amount of time UNIX (period) for rasingTime
  */
  uint256  public raisingPeriod;

  /**
  * @dev amount of time UNIX (period) for icoTime
  */
  uint256  public waitingPeriod;

  /**
  * @dev amount of time UNIX (period) for fundDeprecatedTime
  */
  uint256  public depricatedPeriod;
  
  /**
  * @dev amount ETH which was accepted from investors - all portions (in ETH) of ICO manager, Pool manager, Admin
  */
  uint256 public totalAcceptedETH;

  /**
  * @dev amount ETH which ICO manager collected from fund balance
  */
  uint256 internal collectedFundForTokens;

  /**
  * @dev amount of Tokens which Investor spend recently
  */
  uint256 internal usedAllowance;
  
  /**
  * @dev percent of collected sum which pool manager will receive
  */
  uint256 public percentPoolManager;

  /**
  * @dev percent of collected sum which admin will receive
  */
  uint256 public percentAdmin;

  /**
  * @dev percent of collected sum which ico manager will receive
  */
  uint256 public percentIcoManager;
  
  /**
  * @dev amount of ETH which is portion of poolManager from fund's collected amount
  */
  uint256 public poolManagerPortion;

  /**
  * @dev amount of ETH which is portion of admin from fund's collected amount
  */
  uint256 public adminPortion;

  /**
  * @dev amount of ETH which is portion of icoManager from fund's collected amount
  */
  uint256 public icoManagerPortion;
  
  /**
  * @dev state that stateholders can change if they want to begin next state before deadline time
  */
  uint8 internal settedPoolState;
  // uint256 public icoTimeout;

  mapping (address => uint8) public approvedInvestors;
  mapping (address => uint256) internal investorSum;
  mapping (address => uint256) internal receivedTokens;
  mapping (address => uint256) internal receivedETH;
  
  function setManager(address _manager) public returns(bool);
  function setTargetToken(address _tokenAddress) public returns(bool);
  // function moneyBack(uint256 _value) public returns(bool);
  // function approveInvestor(address _investor)  public returns(bool);
  function getRaisingETH(uint256 _value) public returns(bool);
  function calculateAllowedTokenBalance(address _owner) internal view returns(uint256);
  function calculateAllowedETHBalance(address _owner) internal view returns(uint256);
  function investorTokenBalance() public view returns(uint256);
  function investorETHBalance() public view returns(uint256);
  function releaseInterest(uint256 _value) public returns(bool);
  function allowedTokens() public view returns(uint256);
  function releaseEtherFromDepricatedFund(uint256 _value) public returns(bool);
  function releaseTokensFromDepricatedFund(uint256 _value) public returns(bool);
  function poolState_() internal view returns(uint8);
  function poolState() public view returns(uint8);

  event MoneyBack(address indexed to, uint256 value);
  event TransferToIcoManager(address indexed from, address indexed to, uint256 value);
  event TokenTransfer(address indexed from, address indexed to, uint256 indexed value);
  event ETHTransfer(address indexed from, address indexed to, uint256 indexed value);
  event Invest(address indexed form, address indexed to, uint256 indexed value);

}

contract PoolModifiers is IPoolVar {

  modifier state(uint8 _state){
    require(poolState_()==_state);
    _;
  }

  // modifier onlyApproved() {
  //   require(approvedInvestors[msg.sender] == 1);
  //   _;
  // }
    
  modifier onlyIcoManager() {
    require(icoManager == msg.sender);
    _;
  }
    
  modifier onlyPoolManager() {
    require(poolManager == msg.sender);
    _;
  }
    
  modifier acceptedDeposit() {
    require(minimalDeposit <= msg.value);
    _;
  }
    
  modifier acceptedrasingTime() {
    require(block.timestamp <= rasingTime);
    _;
  }

  modifier onlyStateHolders() {
    require(icoManager == msg.sender || poolManager == msg.sender || owner == msg.sender);
    _;
  }

  modifier onlyAdminOrPoolMng() {
    require(poolManager == msg.sender || owner == msg.sender);
    _;
  }

}

contract IPool is PoolModifiers {
    
  using SafeMath for uint256;
  
  /**
  * @dev set ICO manager
  * @param _manager of ICO manager
  * @return result of operation: true if success
  */
  function setManager(address _manager) public onlyOwner state(STATE_DEFAULT) returns(bool) {
    icoManager = _manager;
    return true;
  }
  
  /**
  * @dev set targetToken address
  * @param _tokenAddress token address
  * @return result of operation: true if success
  */
  function setTargetToken(address _tokenAddress) public onlyOwner state(STATE_DEFAULT) returns(bool) {
    targetToken = _tokenAddress;
    return true;
  }

  /**
  * @dev payable function to accept ETH from approved investors
  */
  function pay() public payable {

    if (poolState() == STATE_RAISING) {
      require(maximalFundSize >= totalAcceptedETH.add(msg.value));
      poolManagerPortion += (msg.value.mul(percentPoolManager)).div(100);    
      adminPortion += (msg.value.mul(percentAdmin)).div(100);    
      icoManagerPortion += (msg.value.mul(percentIcoManager)).div(100);    
      totalAcceptedETH = (totalAcceptedETH.add(msg.value)).sub((poolManagerPortion.add(adminPortion)).add(icoManagerPortion));
      investorSum[msg.sender] = (investorSum[msg.sender].add(msg.value)).sub((poolManagerPortion.add(adminPortion)).add(icoManagerPortion));
      emit Invest(msg.sender, this, msg.value);
    }
    else if (poolState() == STATE_MONEY_BACK) {
      moneyBackOrDistribution(0, investorSum[msg.sender]);
    } 
    else if (poolState() == STATE_TOKENS_DISTRIBUTION) {
      moneyBackOrDistribution(calculateAllowedTokenBalance(msg.sender), calculateETHPortion(msg.sender, calculateAllowedTokenBalance(msg.sender)));
    }

  }

  /**
  * @dev investors can return their dividents by using this function 
  * @param _value amount of ETH to return to investor
  * @return result of operation: true if success
  */
  // function moneyBack(uint256 _value) public state(STATE_MONEY_BACK) returns(bool) {
  //   // investorSum[msg.sender] = investorSum[msg.sender].sub(_value);
  //   // totalAcceptedETH = totalAcceptedETH.sub(_value);
  //   payETH(msg.sender, _value);
  //   emit MoneyBack(msg.sender, _value);
  //   return true;
  // }

  /**
  * @dev allow to apporove invesotors of pooling account
  * @param _investor address of investor who will be approved
  * @return result of operation: true if success
  */  
  // function approveInvestor(address _investor)  public onlyOwner returns(bool) {
  //   approvedInvestors[_investor] = 1;
  //   return true;
  // }
  
  /**
  * @dev transfer collected amount of ETH to ICO manager address
  * @param _value in ETH 10^18 which ICO manager wants to get
  * @return result of operation: true if success
  */
  function getRaisingETH(uint256 _value) public onlyIcoManager returns(bool) {
    require(poolState_() >= 2 && poolState_() != 0xFF);  
    require(totalAcceptedETH >= _value);
    totalAcceptedETH = totalAcceptedETH.sub(_value);
    icoManager.transfer(_value);
    collectedFundForTokens = collectedFundForTokens.add(_value);
    emit TransferToIcoManager(targetToken, icoManager, _value);
    return true;
  }
  
  /**
  * @dev transfer collected amount of ETH stateholders (their portion)
  * @return result of operation: true if success
  */
  function getPortion() public onlyStateHolders returns(bool) {
    if (msg.sender == icoManager) {
      icoManager.transfer(icoManagerPortion);    
      return true;
    }
    else if (msg.sender == poolManager) {
      poolManager.transfer(poolManagerPortion);    
      return true;
    }
    else if (msg.sender == owner) {
      owner.transfer(adminPortion); 
      return true;    
    }
    else {
      return false;    
    }
  }
  
  /**
  * @dev calculate amount of tokens that investor can spend 
  * @param _owner investor's address
  * @return allowed amount of tokens 
  */
  function calculateAllowedTokenBalance(address _owner) internal view returns(uint256) {
    ERC20 icoContract = ERC20(targetToken);
    uint256 totalAllowance = icoContract.allowance(icoManager, this);
    return (investorSum[_owner].mul(totalAllowance.add(usedAllowance)).div(totalAcceptedETH.add(collectedFundForTokens))).sub(receivedTokens[_owner]);
  }
  
  /**
  * @dev calculate amount of ETH that investor can spend 
  * @param _owner investor's address
  * @return allowed amount of ETH 
  */
  function calculateAllowedETHBalance(address _owner) internal view returns(uint256) {
    return (investorSum[_owner].mul(totalAcceptedETH).div(totalAcceptedETH.add(collectedFundForTokens))).sub(receivedETH[_owner]);
  }
  
  /**
  * @dev returns amount of tokens on invesotr's balance
  * @return amount of tokens
  */
  function investorTokenBalance() public view returns(uint256) {
    return calculateAllowedTokenBalance(msg.sender);
  }
  
  /**
  * @dev returns amount of ETH on invesotr's balance
  * @return amount of ETH
  */
  function investorETHBalance() public view returns(uint256) {
    return calculateAllowedETHBalance(msg.sender);
  }
  
  function payETH(address _sender, uint256 _value) internal {
    require(calculateAllowedETHBalance(_sender) >= _value);
    _sender.transfer(_value);
    receivedETH[_sender] = receivedETH[_sender].add(_value);
  } 

  function calculateETHPortion(address _sender, uint256 _value) internal view returns(uint256) {
    uint256 currentTokenBalance = calculateAllowedTokenBalance(_sender);
    require(currentTokenBalance >= _value);
    uint256 calcETH = _value.mul(calculateAllowedETHBalance(_sender)).div(currentTokenBalance);
    return calcETH;
  }

  function payTokens(address _sender, uint256 _value) internal {
    ERC20 icoContract = ERC20(targetToken);
    icoContract.transferFrom(icoManager, _sender, _value);
    receivedTokens[_sender] = receivedTokens[_sender].add(_value);
    usedAllowance = usedAllowance.add(_value);
    emit TokenTransfer(targetToken, _sender, _value);
  } 

  
  function moneyBackOrDistribution(uint256 _tokenValue, uint256 _ETHValue) internal {
    payETH(msg.sender, _ETHValue);
    if(poolState_() == STATE_MONEY_BACK) {
      emit MoneyBack(msg.sender, _ETHValue);
    } else {
      payTokens(msg.sender, _tokenValue);
      emit ETHTransfer(this, msg.sender, _ETHValue);
    }
  }

  /**
  * @dev transfer dividnets to invstor address in ETH and tokens 
  * @param _value amount of tokens
  * @return result of operation: true if success
  */
  // function releaseInterest(uint256 _value) public state(STATE_TOKENS_DISTRIBUTION) returns(bool) {
    
  //   moneyBackOrDistribution(_value, calcETH);
  //   return true;
  // }
  
  /**
  * @dev return amount of allowed tokens which ICO manager approve to smart contract
  * @return amount of tokens
  */
  function allowedTokens() public view onlyPoolManager returns(uint256) {
    ERC20 ercToken = ERC20(targetToken);
    return ercToken.allowance(icoManager, this);
  }
  
  /**
  * @dev transfer all amount of ETH from pooling contract when fund id depricated
  * @return result of operation: true if success
  */
  function releaseEtherFromDepricatedFund(uint256 _value) public onlyPoolManager state(STATE_FUND_DEPRECATED) returns(bool) {
    require(totalAcceptedETH >= _value);
    poolManager.transfer(_value);
    totalAcceptedETH = totalAcceptedETH.sub(_value);
    emit ETHTransfer(this, poolManager, _value);
    return true;
  } 
  
  /**
  * @dev transfer all amount of tokens from pooling contract when fund id depricated
  * @return result of operation: true if success
  */
  function releaseTokensFromDepricatedFund(uint256 _value) public onlyPoolManager state(STATE_FUND_DEPRECATED) returns(bool) {
    ERC20 ercToken = ERC20(targetToken);
    uint256 totalAllowance = ercToken.allowance(icoManager, this);
    require(totalAllowance >= _value);
    ercToken.transferFrom(icoManager, poolManager, _value);
    emit TokenTransfer(icoManager, poolManager, _value);
    return true;
  } 

  /**
  * @dev Pool Manager start Raising ETH
  * @return result of operation: true if success
  */
  function startRasing() public onlyPoolManager state(STATE_DEFAULT) returns(bool) {
    rasingTime = raisingPeriod + block.timestamp;
    icoTime = waitingPeriod + block.timestamp;
    fundDeprecatedTime = depricatedPeriod + block.timestamp;
    
    settedPoolState = STATE_RAISING;
    return true;
  }

  /**
  * @dev Pool Manager or ICO manager or Admin can start Wait for ICO state if contract have enough money 
  * @return result of operation: true if success
  */
  function startWaitForICO() public onlyStateHolders state(STATE_RAISING) returns(bool) {
    require(address(this).balance >= minimalFundSize);
    settedPoolState = STATE_WAIT_FOR_ICO;
    return true;
  }

  /**
  * @dev Pool Manager or Admin can start money back if it's Raising state
  * @return result of operation: true if success
  */
  function startMoneyBack() public onlyAdminOrPoolMng state(STATE_RAISING) returns(bool) {
    settedPoolState = STATE_MONEY_BACK;
    return true;
  }

  /**
  * @dev Pool Manager or Admin can start distribution
  * @return result of operation: true if success
  */
  function startDistribution() public onlyStateHolders state(STATE_WAIT_FOR_ICO) returns(bool) {
    settedPoolState = STATE_TOKENS_DISTRIBUTION;
    return true;
  }
  
  /**
  * @dev calculate current pool state
  * @return current pool state
  */
  function poolState_() internal view returns(uint8) {
    if(settedPoolState == STATE_RAISING && rasingTime == 0 || settedPoolState == STATE_RAISING && block.timestamp <= rasingTime ) {
      return STATE_RAISING;
    } 
    else if( (settedPoolState == STATE_WAIT_FOR_ICO && block.timestamp <= rasingTime && totalAcceptedETH.add(collectedFundForTokens) >= minimalFundSize) || (block.timestamp >= raisingPeriod && totalAcceptedETH.add(collectedFundForTokens) >= minimalFundSize && block.timestamp <= icoTime)  ) {
      return STATE_WAIT_FOR_ICO;
    } 
    else if( (block.timestamp >= icoTime && block.timestamp <= fundDeprecatedTime) || (settedPoolState == STATE_MONEY_BACK) || (settedPoolState == STATE_TOKENS_DISTRIBUTION) ) {
      if ( ( minimalFundSize > totalAcceptedETH.add(collectedFundForTokens) ) || (settedPoolState == STATE_MONEY_BACK) ) {
        return STATE_MONEY_BACK;
      } 
      else if (settedPoolState == STATE_TOKENS_DISTRIBUTION || block.timestamp >= icoTime ){
        return STATE_TOKENS_DISTRIBUTION;
      }
    } 
    else if(block.timestamp >= fundDeprecatedTime && fundDeprecatedTime != 0) {
      return STATE_FUND_DEPRECATED;
    } 
    else {
      return STATE_DEFAULT;
    }
  }  
 
  /**
  * @dev returns current pool state
  * @return current pool state
  */
  function poolState() public view returns(uint8) {
    return poolState_();
  }
}

contract Pool is IPool {
    
  /**
  * @dev constructor of Pooling token
  */
  constructor() public { 

    poolManager = msg.sender;
    owner = msg.sender;
    
    minimalDeposit = 1e8;
    minimalFundSize = 1e18;
    maximalFundSize = 20e18;
    
    raisingPeriod = 30;
    waitingPeriod = 40;
    depricatedPeriod = 1000000;
    
    percentPoolManager = 5;
    percentAdmin = 3;
    percentIcoManager = 2;
    
  }
    
}