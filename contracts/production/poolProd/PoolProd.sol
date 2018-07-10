pragma solidity ^0.4.23;

import "../../abstract/Pool/Pool.sol";
import "../../abstract/TimeMachine/TimeMachineP.sol";

contract PoolProd is Pool, TimeMachineP {
  uint constant DECIMAL_MULTIPLIER = 1e18;
  
  /**
   * @param _raisingPeriod time to raise ETH for ICO
   * @param _icoPeriod time to wait tokens from ICO manager
   * @param _distributionPeriod time to distribute tokens and remaining ETH to investors
   * @param _minimalFundSize minimal collected fund in ETH
   * @param _maximalFundSize maximal collected fund in ETH
   * @param _minimalDeposit minimal amount of ETH in wei which is allowed to become investor
   * @param _adminShare share of the contract creator in percent, multiplied by 1e18, divided by 100
   * @param _poolManagerShare share of the pool manager in percent, multiplied by 1e18, divided by 100
   * @param _poolManagerAddress address of pool manager
   * @param _ICOManagerAddress address of ICO manager
   * @param  _paybotAddress address of pay bot
   * @param _tokenPrice price of one erc20 token in ethers (if zero - ICOManager determine number of tokens by authority)
   */
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
              address _paybotAddress,
              address _tokenAddress,
              uint _tokenPrice) public {
    
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

    tokenAddress = _tokenAddress;
    tokenPrice = _tokenPrice;
  }
}