pragma solidity ^0.4.23;

import "../../abstract/Pool/Pool.sol";
import "../../abstract/TimeMachine/TimeMachineT.sol";

contract PoolProd is Pool, TimeMachineT {
  uint constant DECIMAL_MULTIPLIER = 1e18;
  
  constructor(uint _raisingPeriod, 
              uint _icoPeriod, 
              uint _distributionPeriod, 
              uint _minimalFundSize, 
              uint _maximalFundSize, 
              uint _minimalDeposit,
              uint _adminShare, 
              uint _poolManagerShare,
              address _poolManagerAddress,
              address _ICOManagerAddress,
              address _paybotAddress) public {
    raisingPeriod = _raisingPeriod;
    icoPeriod = _icoPeriod;
    distributionPeriod = _distributionPeriod;

    minimalFundSize = _minimalFundSize;
    maximalFundSize = _maximalFundSize;

    minimalDeposit = _minimalDeposit;

    stakeholderShare[RL_ADMIN] = _adminShare;
    stakeholderShare[RL_POOL_MANAGER] = _poolManagerShare;
    stakeholderShare[RL_ICO_MANAGER] = DECIMAL_MULTIPLIER - _adminShare - _poolManagerShare;

    setRole_(RL_ADMIN, msg.sender);
    setRole_(RL_POOL_MANAGER, _poolManagerAddress);
    setRole_(RL_ICO_MANAGER, _ICOManagerAddress);
    setRole_(RL_PAYBOT, _paybotAddress);
  }
}