pragma solidity ^0.4.21;
import "../ownership/Ownable.sol";
import "../math/SafeMath.sol";

contract IPool is Ownable {
  address public poolManager;
  address public icoManager;
  address public owner;
  address public targetToken;
  uint public raisingTimeout;
  // uint public icoTimeout;
  uint public minimalDeposit;
  uint public minimalFundSize;
  uint public maximalFundSize;
  uint public fundDeprecatedTimeout;
  mapping (address => uint8) public approvedInvestors;
  function approveInvestor(address investor) public returns(bool);
  function () public payable;
  function releaseInterest(uint value) public retu;
  function moneyBack(uint value) public;
  function poolState() public view returns(uint8);
}

contract Pool is IPool {
    
  using SafeMath for uint256;

  event MoneyBack(address indexed to, uint256 value);
  event TransferToIcoManager(address indexed to, uint256 value);

  uint256 totalAcceptedETH;

  mapping(address=>uint256) investorSum;

  uint8 = poolState;
    
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
    icoManager = msg.sender;
    owner = msg.sender;
    poolState = 0;
    minimalFundSize = 100e18;
    maximalFundSize = 300e18;
    raisingTimeout = 1625556505;
    icoTimeout = 1635556505;
    fundDeprecatedTimeout = 1825556505;
  }
  
  function () public payable onlyApproved acceptedDeposit acceptedRaisingTimeout {
    require(maximalFundSize >= totalAcceptedETH.add(msg.value));
    totalAcceptedETH = totalAcceptedETH.add(msg.value);
    investorSum[msg.sender] = investorSum[msg.sender].add(msg.value);
  }

  function moneyBack(uint _value) public returns(bool) {
    require(poolState == 3);
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
    require(poolState == 2);  
    require(totalAcceptedETH >= value);
    totalAcceptedETH = totalAcceptedETH.sub(_value);
    icoManager.transfer(_value);
    emit TransferToIcoManager(icoManager, _value);
    return true;
  }

  function releaseInterest(uint value) public returns(bool) {
    require(poolState == 4);
  }

  function poolState() public view returns(uint8) {
    return poolState;
  }

  /** Можно сделать так, чтобы вручную нельзя было устанавливать poolState. 
   *  Вызвать функцию может кто угодно. 
   *  При вызове проверяется блок таймстемп и через if else различные даты, которые устанавливаются в конструкторе
   *  Если подходит под дату, то устанавливается соответствующее состояние. 
   *  Так же делаются проверки на минимальную сумму сбора после закрытия сбора средств.
   */
  function setPoolState(uint8 _state) public returns(bool) {
    if(block.timestamp <= raisingTimeout && _state == 1) { 
      poolState = _state;
      return true;
    } 
    else if (block.timestamp <=icoTimeout && _state == 2) {
      poolState = _state;
      return true;
    } 
    else {
      poolState = _state;
      return true;
    }
  }

}