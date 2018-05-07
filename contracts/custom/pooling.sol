pragma solidity ^0.4.21;
import "../ownership/Ownable.sol";
import "../math/SafeMath.sol";
import "../token/ERC20/ERC20.sol";

contract IPool is Ownable {

  address public poolManager;
  address public icoManager;
  address public owner;
  address public targetToken;
  uint256 public startRaising;
  uint256 public raisingTimeout;
  uint256 public icoStart;
  uint256 public minimalDeposit;
  uint256 public minimalFundSize;
  uint256 public maximalFundSize;
  uint256 public fundDeprecatedTimeout;
  uint256 public totalAcceptedETH;
  uint256 internal collectedFundForTokens;
  uint256 internal usedAllowance;
  // uint256 public icoTimeout;

  mapping (address => uint8) public approvedInvestors;
  mapping (address => uint256) internal investorSum;
  mapping (address => uint256) internal receivedTokens;
  mapping (address => uint256) internal receivedETH;

  function moneyBack(uint256 _value) public returns(bool);
  function approveInvestor(address _investor)  public returns(bool);
  function getRaisingETH(uint256 _value) public returns(bool);
  function calculateAllowedTokenBalance(address _owner) private returns(uint256);
  function calculateAllowedETHBalance(address _owner) internal returns(uint256);
  function investorTokenBalance() public view returns(uint256);
  function investorETHBalance() public view returns(uint256);
  function releaseInterest(uint256 _value) public returns(bool);
  function allowedTokens() public view returns(uint256);
  function releaseEtherFromDepricatedFund(uint256 _value) public returns(bool);
  function releaseTokensFromDepricatedFund(uint256 _value) public returns(bool);
  function poolState_() private view returns(uint8);
  function poolState() public view returns(uint8);

  event MoneyBack(address indexed to, uint256 value);
  event TransferToIcoManager(address indexed from, address indexed to, uint256 value);
  event TokenTransfer(address indexed from, address indexed to, uint256 indexed value);
  event ETHTransfer(address indexed from, address indexed to, uint256 indexed value);
  event Invest(address indexed form, address indexed to, uint256 indexed value);

}

contract PoolModifiers is IPool {

  modifier onlyApproved() {
    require(approvedInvestors[msg.sender] == 1);
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
    
  modifier acceptedRaisingTimeout() {
    require(block.timestamp <= raisingTimeout);
    _;
  }

}

contract Pool is PoolModifiers {
    
  using SafeMath for uint256;

  /**
  * @dev constructor of Pooling token
  */
  constructor() public{ 
    poolManager = msg.sender;
    icoManager = 0x14723a09acff6d2a60dcdf7aa4aff308fddc160c;
    owner = msg.sender;
    targetToken = 0x0b2f1fc73fd95d53ef57af3ca4155ec97725350d;
    minimalDeposit = 1e8;
    minimalFundSize = 1e18;
    maximalFundSize = 3e18;
    startRaising = now + 10;
    raisingTimeout = now + 70;
    icoStart = now + 80; 
    // icoTimeout = 1635556505;
    fundDeprecatedTimeout = now + 100;
  }

  /**
  * @dev payable function to accept ETH from approved investors
  */
  function () public payable onlyApproved acceptedDeposit acceptedRaisingTimeout {
    require(maximalFundSize >= totalAcceptedETH.add(msg.value));
    totalAcceptedETH = totalAcceptedETH.add(msg.value);
    investorSum[msg.sender] = investorSum[msg.sender].add(msg.value);
    emit Invest(msg.sender, this, msg.value);
  }

  /**
  * @dev investors can return their dividents by using this function 
  * @param _value amount of ETH to return to investor
  * @return result of operation: true if success
  */
  function moneyBack(uint256 _value) public returns(bool) {
    require(poolState_() == 3);
    require(investorSum[msg.sender] >= _value);
    require(_value >= minimalDeposit);
    investorSum[msg.sender] = investorSum[msg.sender].sub(_value);
    totalAcceptedETH = totalAcceptedETH.sub(_value);
    msg.sender.transfer(_value);
    emit MoneyBack(msg.sender, _value);
    return true;
  }

  /**
  * @dev allow to apporove invesotors of pooling account
  * @param _investor address of investor who will be approved
  * @return result of operation: true if success
  */  
  function approveInvestor(address _investor)  public onlyOwner returns(bool) {
    approvedInvestors[_investor] = 1;
    return true;
  }
  
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
  * @dev calculate amount of tokens that investor can spend 
  * @param _owner investor's address
  * @return allowed amount of tokens 
  */
  function calculateAllowedTokenBalance(address _owner) private returns(uint256) {
    ERC20 ico_contract = ERC20(targetToken);
    uint256 totalAllowance = ico_contract.allowance(icoManager, this);
    return (investorSum[_owner].mul(totalAllowance.add(usedAllowance)).div(totalAcceptedETH.add(collectedFundForTokens))).sub(receivedTokens[_owner]);
  }
  
  /**
  * @dev calculate amount of ETH that investor can spend 
  * @param _owner investor's address
  * @return allowed amount of ETH 
  */
  function calculateAllowedETHBalance(address _owner) internal returns(uint256) {
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
  
  /**
  * @dev transfer dividnets to invstor address in ETH
  * @param _value amount of ETH in 10^18
  * @return result of operation: true if success
  */
  function releaseInterest(uint256 _value) public returns(bool) {
    require(poolState_() == 4);
    uint256 currentTokenBalance = calculateAllowedTokenBalance(msg.sender);
    require(currentTokenBalance >= _value);
    ERC20 ico_contract = ERC20(targetToken);
    ico_contract.transferFrom(icoManager, msg.sender, _value);
    receivedTokens[msg.sender] = receivedTokens[msg.sender].add(_value);
    usedAllowance = usedAllowance.add(_value);
    emit TokenTransfer(targetToken, msg.sender, _value);
    uint256 calcETH = _value.mul(calculateAllowedETHBalance(msg.sender)).div(currentTokenBalance);
    msg.sender.transfer(calcETH);
    receivedETH[msg.sender] = receivedETH[msg.sender].add(calcETH);
    emit ETHTransfer(this, msg.sender, calcETH);
    return true;
  }
  
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
  function releaseEtherFromDepricatedFund(uint256 _value) public onlyPoolManager returns(bool) {
    require(poolState_() == 0xFF);
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
  function releaseTokensFromDepricatedFund(uint256 _value) public onlyPoolManager returns(bool) {
    require(poolState_() == 0xFF);
    ERC20 ercToken = ERC20(targetToken);
    uint256 totalAllowance = ercToken.allowance(icoManager, this);
    require(totalAllowance >= _value);
    ercToken.transferFrom(icoManager, poolManager, _value);
    emit TokenTransfer(icoManager, poolManager, _value);
    return true;
  } 
  
  /**
  * @dev calculate current pool state
  * @return current pool state
  */
  function poolState_() private view returns(uint8) {
    if(block.timestamp >= startRaising && block.timestamp < raisingTimeout) {
      return 1;
    } 
    else if(block.timestamp >= raisingTimeout && block.timestamp < icoStart) {
      return 2;
    } 
    else if(block.timestamp >= icoStart && block.timestamp < fundDeprecatedTimeout) {
      if (minimalFundSize > totalAcceptedETH.add(collectedFundForTokens)) {
        return 3;
      } 
      else {
        return 4;
      }
    } 
    else if(block.timestamp >= fundDeprecatedTimeout) {
      return 0xFF;
    } 
    else {
      return 0;
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