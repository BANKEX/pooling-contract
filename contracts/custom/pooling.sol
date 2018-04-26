pragma solidity ^0.4.21;
import "../ownership/Ownable.sol";
import "../math/SafeMath.sol";

contract IPool is Ownable {
  address public poolManager;
  address public icoManager;
  address public owner;
  address public targetToken;
  uint public raisingTimeout;
  uint public icoTimeout;
  uint public minimalDeposit;
  uint public minimalFundSize;
  uint public maximalFundSize;
  uint public fundDeprecatedTimeout;
  mapping (address => uint8) public approvedInvestors;
  function approveInvestor(address investor) public returns(bool);
  function () public payable;
  function releaseInterest(uint value) public;
  function moneyBack(uint value) public;
  function poolState() public view returns(uint8);
}

contract Pool is IPool {
    
  using SafeMath for uint256;
  uint256 totalAccptedETH;
    
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
    require(msg.value <= minimalDeposit);
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
  }
  
  function () public payable onlyApproved acceptedDeposit acceptedRaisingTimeout {
    totalAccptedETH = totalAccptedETH.add(msg.value);
  }
    
  function approveInvestor(address investor)  public onlyPoolManager returns(bool) {
    approvedInvestors[investor] = 1;
    return true;
  }
}