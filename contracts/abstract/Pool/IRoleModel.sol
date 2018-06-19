pragma solidity ^0.4.23;

contract IRoleModel {
  /**
  * @dev RL_DEFAULT is role of basic account for example: investor
  */
  uint8 constant RL_DEFAULT = 0x00;
  
  /**
  * @dev RL_POOL_MANAGER is role of person who will initialize pooling contract by asking admin to create it
  * this person will find ICO and investors
  */
  uint8 constant RL_POOL_MANAGER = 0x01;
  
  /**
  * @dev RL_ICO_MANAGER is role of person who have access to ICO contract as owner or tokenholder
  */
  uint8 constant RL_ICO_MANAGER = 0x02;
  
  /**
  * @dev RL_ADMIN is role of person who create contract (BANKEX admin)
  */
  uint8 constant RL_ADMIN = 0x04;
  
  /**
  * @dev RL_PAYBOT is like admin but without some capabilities that RL_ADMIN has
  */
  uint8 constant RL_PAYBOT = 0x08;

  function getRole_() view internal returns(uint8);
  function getRole_(address _for) view internal returns(uint8);
  function getRoleAddress_(uint8 _for) view internal returns(address);
  
}