pragma solidity ^0.4.21;
import "../ownership/Ownable.sol";
import "../math/SafeMath.sol";
import "../token/ERC20/ERC20.sol";


contract IPoolVar is Ownable {

  uint8 constant STATE_DEFAULT = 0;
  uint8 constant STATE_RAISING = 1;
  uint8 constant STATE_WAIT_FOR_ICO = 2;
  uint8 constant STATE_MONEY_BACK = 3;
  uint8 constant STATE_TOKEN_DISTRIBUTION = 4;
  uint8 constant STATE_FUND_DEPRECATED = 0xFF;
  uint256 constant DECIMAL_MULTIPLIER = 10**2;
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
  uint256 public raisingPeriod;

  /**
  * @dev amount of time UNIX (period) for icoTime
  */
  uint256 public waitingPeriod;

  /**
  * @dev amount of time UNIX (period) for fundDeprecatedTime
  */
  uint256 public depricatedPeriod;
  
  /**
  * @dev amount ETH which was accepted from investors - all portions (in ETH) of ICO manager, Pool manager, Admin
  */
  uint256 public totalAcceptedETH;

  /**
  * @dev amount ETH which ICO manager collected from fund balance
  */
  uint256 internal collectedFundForToken;

  /**
  * @dev amount of Token which Investor spend recently
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
  mapping (address => uint256) internal receivedToken;
  mapping (address => uint256) internal receivedETH;
  
  function setICOManager(address _manager) public returns(bool);
  function setPoolManager(address _manager) public returns(bool);
  function setTargetToken(address _tokenAddress) public returns(bool);
  // function approveInvestor(address _investor)  public returns(bool);
  function getRaisingETH(uint256 _value) public returns(bool);
  function getPortion() public returns(bool);
  function getAllowance_() internal returns(uint256);
  function getTokenBalance_(address _owner) internal view returns(uint256);
  function getETHBalance_(address _owner) internal view returns(uint256);
  function getTokenBalance() external view returns(uint256);
  function getETHBalance() external view returns(uint256);
  function distributeETH_(address _receiver, uint256 _value) internal;
  function distributeToken_(address _receiver, uint256 _value) internal;
  function releaseInterest(uint256 _tokenValue, uint256 _ETHValue) external returns(bool);
  function allowedToken() public view returns(uint256);
  function releaseEtherFromDepricatedFund(uint256 _value) public returns(bool);
  function releaseTokenFromDepricatedFund(uint256 _value) public returns(bool);
  function startRaising() public returns(bool);
  function startWaitForICO() public returns(bool);
  function startMoneyBack() public returns(bool);
  function startDistribution() public returns(bool);
  function poolState_() internal view returns(uint8);
  function poolState() public view returns(uint8);

  event MoneyBack(address indexed to, uint256 value);
  event TransferToIcoManager(address indexed from, address indexed to, uint256 value);
  event TokenTransfer(address indexed from, address indexed to, uint256 indexed value);
  event ETHTransfer(address indexed from, address indexed to, uint256 indexed value);
  event Invest(address indexed form, address indexed to, uint256 indexed value);

}

contract PoolModifiers is IPoolVar {

  modifier state(uint8 _state) {
    require(poolState_() == _state);
    _;
  }

  // modifier onlyApproved() {
  //   require(approvedInvestors[msg.sender] == 1);
  //   _;
  // }

  modifier moneyBackOrStateDist() {
    require(poolState_() == STATE_MONEY_BACK || poolState_() == STATE_TOKEN_DISTRIBUTION);
    _;
  }
    
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
  function setICOManager(address _manager) public onlyOwner state(STATE_DEFAULT) returns(bool) {
    icoManager = _manager;
    return true;
  }

  /**
  * @dev set Pool manager
  * @param _manager of Pool manager
  * @return result of operation: true if success
  */
  function setPoolManager(address _manager) public onlyOwner state(STATE_DEFAULT) returns(bool) {
    poolManager = _manager;
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
    uint256 _investorSum = investorSum[msg.sender];
    if (poolState() == STATE_RAISING) {
     acceptPayment_(msg.value);
    }
    else if (poolState() == STATE_MONEY_BACK) {
      sendBack_(msg.value, msg.sender);
      distributeETH_(msg.sender, _investorSum);
      emit MoneyBack(msg.sender, _investorSum);
    } 
    else if (poolState() == STATE_TOKEN_DISTRIBUTION) {
      sendBack_(msg.value, msg.sender);
      distributeToken_(msg.sender, getTokenBalance_(msg.sender));
      distributeETH_(msg.sender, getETHBalance_(msg.sender));
      emit ETHTransfer(this, msg.sender, _investorSum);
    }

  }

    /**
  * @dev will accept payment from investor if it's rasing period 
  * @param _value amount of ETH that was taken from investor
  */
  function acceptPayment_(uint256 _value) private state(STATE_RAISING) returns(bool) {
    require(maximalFundSize >= totalAcceptedETH.add(_value));
    poolManagerPortion = poolManagerPortion.add((_value.mul(percentPoolManager)).div(DECIMAL_MULTIPLIER));    
    adminPortion = adminPortion.add((_value.mul(percentAdmin)).div(DECIMAL_MULTIPLIER));    
    icoManagerPortion = icoManagerPortion.add((_value.mul(percentIcoManager)).div(DECIMAL_MULTIPLIER));    
    totalAcceptedETH = (totalAcceptedETH.add(_value)).sub(((_value.mul(percentPoolManager)).div(DECIMAL_MULTIPLIER).add((_value.mul(percentAdmin)).div(DECIMAL_MULTIPLIER))).add((_value.mul(percentIcoManager)).div(DECIMAL_MULTIPLIER)));
    investorSum[msg.sender] = (investorSum[msg.sender].add(_value)).sub(((_value.mul(percentPoolManager)).div(DECIMAL_MULTIPLIER).add((_value.mul(percentAdmin)).div(DECIMAL_MULTIPLIER))).add((_value.mul(percentIcoManager)).div(DECIMAL_MULTIPLIER)));
    emit Invest(msg.sender, this, _value);  
    return true;
  }
  
  /**
  * @dev will accept payment from investor if it's rasing period 
  * @param _value amount of ETH that was taken from investor
  * @param _address who's address we need to send back 
  */
  function sendBack_(uint256 _value, address _address) private returns(bool) {
    _address.transfer(_value);
    return true;
  }

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
    collectedFundForToken = collectedFundForToken.add(_value);
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
  * @dev get total allowance of tokens
  * @return total allowed amount of tokens
  */
  function getAllowance_() internal returns(uint256) {
    ERC20 icoContract = ERC20(targetToken);
    return icoContract.allowance(icoManager, this);
  }

  /**
  * @dev calculate amount of tokens that investor can spend 
  * @param _owner investor's address
  * @return allowed amount of tokens 
  */
  function getTokenBalance_(address _owner) internal view returns(uint256) {
    return (investorSum[_owner].mul(getAllowance_().add(usedAllowance)).div(totalAcceptedETH.add(collectedFundForToken))).sub(receivedToken[_owner]);
  }
  
  /**
  * @dev calculate amount of ETH that investor can spend 
  * @param _owner investor's address
  * @return allowed amount of ETH 
  */
  function getETHBalance_(address _owner) internal view returns(uint256) {
    return (investorSum[_owner].mul(totalAcceptedETH).div(totalAcceptedETH.add(collectedFundForToken))).sub(receivedETH[_owner]);
  }
  
  /**
  * @dev returns amount of tokens on invesotr's balance
  * @return amount of tokens
  */
  function getTokenBalance() external view returns(uint256) {
    return getTokenBalance_(msg.sender);
  }
  
  /**
  * @dev returns amount of ETH on invesotr's balance
  * @return amount of ETH
  */
  function getETHBalance() external view returns(uint256) {
    return getETHBalance_(msg.sender);
  }
  
  /**
  * @dev send ETH to address
  * @param _receiver eth receiver
  * @param _value value
  */
  function distributeETH_(address _receiver, uint256 _value) moneyBackOrStateDist() internal {
    require(getETHBalance_(_receiver) >= _value);
    _receiver.transfer(_value);
    receivedETH[_receiver] = receivedETH[_receiver].add(_value);
  } 

  /**
  * @dev send Tokens to address
  * @param _receiver tokens receiver
  * @param _value value
  */
  function distributeToken_(address _receiver, uint256 _value) moneyBackOrStateDist() internal {
    require(getTokenBalance_(_receiver) >= _value);
    ERC20 ercToken = ERC20(targetToken);
    ercToken.transferFrom(icoManager, _receiver, _value);
    receivedToken[_receiver] = receivedToken[_receiver].add(_value);
    usedAllowance = usedAllowance.add(_value);
    emit TokenTransfer(targetToken, _receiver, _value);
  } 

  /**
  * @dev send ETH to address
  * @param _tokenValue destribute value of tokens
  * @param _ETHValue destribute value of ETH
  */
  function releaseInterest(uint256 _tokenValue, uint256 _ETHValue) external returns(bool) {
    distributeToken_(msg.sender, _tokenValue);
    distributeETH_(msg.sender, _ETHValue);
    return true;
  }
  
  /**
  * @dev return amount of allowed tokens which ICO manager approve to smart contract
  * @return amount of tokens
  */
  function allowedToken() public view onlyPoolManager returns(uint256) {
    ERC20 ercToken = ERC20(targetToken);
    return ercToken.allowance(icoManager, this);
  }
  
  /**
  * @dev transfer all amount of ETH from pooling contract when fund id depricated 
  * @param _value amount of ETH from pooling contract
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
  * @param _value amount of tokens from pooling contract
  * @return result of operation: true if success
  */
  function releaseTokenFromDepricatedFund(uint256 _value) public onlyPoolManager state(STATE_FUND_DEPRECATED) returns(bool) {
    require(getAllowance_() >= _value);
    ERC20 ercToken = ERC20(targetToken);
    ercToken.transferFrom(icoManager, poolManager, _value);
    emit TokenTransfer(icoManager, poolManager, _value);
    return true;
  } 

  /**
  * @dev Pool Manager start Raising ETH
  * @return result of operation: true if success
  */
  function startRaising() public onlyPoolManager state(STATE_DEFAULT) returns(bool) {
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
    settedPoolState = STATE_TOKEN_DISTRIBUTION;
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
    else if( (settedPoolState == STATE_WAIT_FOR_ICO && block.timestamp <= rasingTime && totalAcceptedETH.add(collectedFundForToken) >= minimalFundSize) || (block.timestamp >= raisingPeriod && totalAcceptedETH.add(collectedFundForToken) >= minimalFundSize && block.timestamp <= icoTime)  ) {
      return STATE_WAIT_FOR_ICO;
    } 
    else if( (block.timestamp >= icoTime && block.timestamp <= fundDeprecatedTime) || (settedPoolState == STATE_MONEY_BACK) || (settedPoolState == STATE_TOKEN_DISTRIBUTION) ) {
      if ( ( minimalFundSize > totalAcceptedETH.add(collectedFundForToken) ) || (settedPoolState == STATE_MONEY_BACK) ) {
        return STATE_MONEY_BACK;
      } 
      else if (settedPoolState == STATE_TOKEN_DISTRIBUTION || block.timestamp >= icoTime ){
        return STATE_TOKEN_DISTRIBUTION;
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