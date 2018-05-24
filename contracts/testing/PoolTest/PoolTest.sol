pragma solidity ^0.4.23;

import "../../abstract/Pool/Pool.sol";
import "../../abstract/TimeMachine/TimeMachineT.sol";

contract PoolTest is Pool, TimeMachineT {
  constructor() public {
    stakeholderShare[RL_ADMIN] = 0.01e18;
    stakeholderShare[RL_POOL_MANAGER] = 0.05e18;
    stakeholderShare[RL_ICO_MANAGER] = 0.94e18;
  }
}