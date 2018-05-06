pragma solidity ^0.4.21;
import "../ownership/Ownable.sol";
import "../math/SafeMath.sol";
import "../token/ERC20/ERC20.sol";

contract IPool is Ownable {
  function approveInvestor(address investor) public returns(bool);
  function releaseTokenInterest(uint _value) public returns(bool);
  function moneyBack(uint _value) public returns(bool);
  function poolState() public view returns(uint8);
}

contract Pool is IPool {
    
  using SafeMath for uint256;

  event MoneyBack(address indexed to, uint256 value);
  event TransferToIcoManager(address indexed from, address indexed to, uint256 value);
  event TokenTransfer(address indexed from, address indexed to, uint256 indexed value);
  event ETHTransfer(address indexed from, address indexed to, uint256 indexed value);
  event Invest(address indexed form, address indexed to, uint256 indexed value);

  address public poolManager;
  address public icoManager;
  address public owner;
  address public targetToken;
  uint public startRaising;
  uint public raisingTimeout;
  uint public icoStart;
  // uint public icoTimeout;
  uint public minimalDeposit;
  uint public minimalFundSize;
  uint public maximalFundSize;
  uint public fundDeprecatedTimeout;
  uint256 totalAcceptedETH;
  uint256 collectedFundForTokens;
  
  mapping (address => uint8) public approvedInvestors;
  mapping (address => uint256) investorSum;
  mapping (address => uint256) receivedTokens;
  mapping (address => uint256) receivedETH;  
    
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

  function Pool()  public {
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
    fundDeprecatedTimeout = 1825556505;
  }
  
  function () public payable onlyApproved acceptedDeposit acceptedRaisingTimeout {
    require(maximalFundSize >= totalAcceptedETH.add(msg.value));
    totalAcceptedETH = totalAcceptedETH.add(msg.value);
    investorSum[msg.sender] = investorSum[msg.sender].add(msg.value);
    emit Invest(msg.sender, this, msg.value);
  }

  function moneyBack(uint _value) public returns(bool) {
    require(poolState_() == 3);
    require(investorSum[msg.sender] >= _value);
    require(_value >= minimalDeposit);
    investorSum[msg.sender] = investorSum[msg.sender].sub(_value);
    totalAcceptedETH = totalAcceptedETH.sub(_value);
    msg.sender.transfer(_value);
    emit MoneyBack(msg.sender, _value);
    return true;
  }
    
  function approveInvestor(address _investor)  public onlyOwner returns(bool) {
    approvedInvestors[_investor] = 1;
    return true;
  }

  function checkRaisingTime() private returns(bool){
    if(block.timestamp <= raisingTimeout) {
      return true;
    } 
    else {
      return false;
    }
  }

  function getRaisingETH(uint256 _value) public onlyIcoManager returns(bool) {
    require(poolState_() >= 2 && poolState_() != 0xFF);  
    require(totalAcceptedETH >= _value);
    totalAcceptedETH = totalAcceptedETH.sub(_value);
    icoManager.transfer(_value);
    collectedFundForTokens = collectedFundForTokens.add(_value);
    emit TransferToIcoManager(targetToken, icoManager, _value);
    return true;
  }

  function calculateAllowedTokenBalance(address _owner) internal returns(uint) {
    ERC20 ico_contract = ERC20(targetToken);
    uint totalAllowance = ico_contract.allowance(icoManager, this);
    if (collectedFundForTokens < investorSum[_owner]) {
      return (collectedFundForTokens.mul(totalAllowance).div(investorSum[_owner])).sub(receivedTokens[_owner]);
    } else {
      return (investorSum[_owner].mul(totalAllowance).div(collectedFundForTokens)).sub(receivedTokens[_owner]);
    }
  }

  function calculateAllowedETHBalance(address _owner) internal returns(uint) {
    return (investorSum[_owner].mul(totalAcceptedETH).div(totalAcceptedETH.add(collectedFundForTokens))).sub(receivedETH[_owner]);
  }

  function investorTokenBalance() public view returns(uint) {
    return calculateAllowedTokenBalance(msg.sender);
  }

  function investorETHBalance() public view returns(uint) {
    return calculateAllowedETHBalance(msg.sender);
  }

  function releaseTokenInterest(uint _value) public returns(bool) {
    require(poolState_() == 4);
    uint currentTokenBalance = calculateAllowedTokenBalance(msg.sender);
    require(currentTokenBalance >= _value);
    ERC20 ico_contract = ERC20(targetToken);
    ico_contract.transferFrom(icoManager, msg.sender, _value);
    receivedTokens[msg.sender] = receivedTokens[msg.sender].add(_value);
    emit TokenTransfer(targetToken, msg.sender, _value);
    uint receiveETH = _value.mul(calculateAllowedETHBalance(msg.sender)).div(currentTokenBalance);
    msg.sender.transfer(receiveETH);
    receivedETH[msg.sender] = receivedETH[msg.sender].add(receiveETH);
    emit ETHTransfer(this, msg.sender, receiveETH);
    return true;
  }

  function poolState_() internal view returns(uint8) {
    if(block.timestamp >= startRaising && block.timestamp < raisingTimeout) {
      return 1;
    } else if(block.timestamp >= raisingTimeout && block.timestamp < icoStart) {
      return 2;
    } else if(block.timestamp >= icoStart && block.timestamp < fundDeprecatedTimeout) {
      if (minimalFundSize > totalAcceptedETH.add(collectedFundForTokens)) {
        return 3;
      } else {
        return 4;
      }
    } else if(block.timestamp >= fundDeprecatedTimeout) {
      return 0xFF;
    } else {
      return 0;
    }
  }

  function poolState() public view returns(uint8) {
    return poolState_();
  }
}