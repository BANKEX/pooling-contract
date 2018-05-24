pragma solidity ^0.4.23;

import "../../abstract/Pool/StateModel.sol";
import "../../abstract/TimeMachine/TimeMachineT.sol";

contract StateModelTest is StateModel, TimeMachineT {
  uint totalEther_;
  uint8 role_;
  
  function getTotalEther_() internal view returns(uint) {
    return totalEther_;
  }
  
  function getRole_() internal view returns(uint8) {
    return role_;
  }

  function getRole_(address addr) internal view returns(uint8) {
    return role_;
  }

  function setRole(uint8 _role) external returns(bool) {
    role_ = _role;
    return true;
  }

  function setTotalEther(uint _totalEther) external returns(bool) {
    totalEther_ = _totalEther;
    return true;
  }


  constructor(uint _raisingPeriod, uint _icoPeriod, uint _distributionPeriod, uint _minimalFundSize, uint _maximalFundSize) public {
    raisingPeriod = _raisingPeriod;
    icoPeriod = _icoPeriod;
    distributionPeriod = _distributionPeriod;

    minimalFundSize = _minimalFundSize;
    maximalFundSize = _maximalFundSize;
  }
}