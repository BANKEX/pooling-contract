pragma solidity ^0.4.23;

contract IStateModel {
  /**
  * @dev ST_DEFAULT state of contract when pooling manager didn't start raising
  * it is an initialization state
  */
  uint8 constant ST_DEFAULT = 0x00;
  
  /**
  * @dev ST_RAISING state of contract when contract is collecting ETH for ICO manager
  */
  uint8 constant ST_RAISING = 0x01;
  
  /**
  * @dev ST_WAIT_FOR_ICO state of contract when contract is waiting for tokens from ICO manager
  */
  uint8 constant ST_WAIT_FOR_ICO = 0x02;
  
  /**
  * @dev ST_MONEY_BACK state of contract when contract return all ETH back to investors
  * it is unusual situation that occurred only if there are some problems
  */
  uint8 constant ST_MONEY_BACK = 0x04;
  
  /**
  * @dev ST_TOKEN_DISTRIBUTION state of contract when contract return all tokens to investors
  * if investor have some ETH that are not taken by ICO manager
  * it is possible to take this ETH back too
  */
  uint8 constant ST_TOKEN_DISTRIBUTION = 0x08;
  
  /**
  * @dev ST_FUND_DEPRECATED state of contract when all functions of contract will not work
  * they will work only for Admin
  * state means that contract lifecycle is ended
  */
  uint8 constant ST_FUND_DEPRECATED = 0x10;
  
  /**
  * @dev TST_DEFAULT time state of contract when contract is waiting to be triggered by pool manager
  */
  uint8 constant TST_DEFAULT = 0x00;
  
  /**
  * @dev TST_RAISING time state of contract when contract is collecting ETH for ICO manager
  */
  uint8 constant TST_RAISING = 0x01;
  
  /**
  * @dev TST_WAIT_FOR_ICO time state of contract when contract is waiting for tokens from ICO manager
  */
  uint8 constant TST_WAIT_FOR_ICO = 0x02;
  
  /**
  * @dev TST_TOKEN_DISTRIBUTION time state of contract when contract return all tokens to investors
  */
  uint8 constant TST_TOKEN_DISTRIBUTION = 0x08;
  
  /**
  * @dev TST_FUND_DEPRECATED time state of contract when all functions of contract will not work
  * they will work only for Admin
  * state means that contract lifecycle is ended
  */
  uint8 constant TST_FUND_DEPRECATED = 0x10;
  
  /**
  * @dev RST_NOT_COLLECTED state of contract when amount ETH is less than minimal amount to buy tokens
  */
  uint8 constant RST_NOT_COLLECTED = 0x01;
  
  /**
  * @dev RST_COLLECTED state of contract when amount ETH is more than minimal amount to buy tokens
  */
  uint8 constant RST_COLLECTED = 0x02;
  
  /**
  * @dev RST_FULL state of contract when amount ETH is more than maximal amount to buy tokens
  */
  uint8 constant RST_FULL = 0x04;

  function getState_() internal view returns (uint8);
  function getShareRemaining_() internal view returns(uint);
}