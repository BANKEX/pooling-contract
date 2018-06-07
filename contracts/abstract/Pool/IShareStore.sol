pragma solidity ^0.4.23;


contract IShareStore {
  function getTotalShare_() internal view returns(uint);
  
  /**
  * @dev event which is triggered every time when somebody send ETH during raising period
  * @param addr is an address of account who sent ETH
  * @param value is a sum in ETH which account sent to pooling contract
  */
  event BuyShare(address indexed addr, uint value);
  
  /**
  * @dev event which is triggered every time when somebody will return it's ETH back during money back period
  * @param addr is an address of account. Pooling contract send ETH to this address
  * @param value is a sum in ETH which was sent from pooling
  */
  event RefundShare(address indexed addr, uint value);
  
  /**
  * @dev event which is triggered every time when stakeholder get ETH from contract
  * @param role is a role of stakeholder (for example: 4 is RL_ADMIN)
  * @param addr is an address of account. Pooling contract send ETH to this address
  * @param value is a sum in ETH which was sent from pooling
  */
  event ReleaseEtherToStakeholder(uint8 indexed role, address indexed addr, uint value);
  
  /**
  * @dev event which is triggered when ICO manager show that value amount of tokens were approved to this contract
  * @param addr is an address of account who trigger function (ICO manager)
  * @param value is a sum in tokens which ICO manager approve to this contract
  */
  event AcceptTokenFromICO(address indexed addr, uint value);
  
  /**
  * @dev event which is triggered every time when somebody will return it's ETH back during token distribution period
  * @param addr is an address of account. Pooling contract send ETH to this address
  * @param value is a sum in ETH which was sent from pooling
  */
  event ReleaseEther(address indexed addr, uint value);
  
  /**
  * @dev event which is triggered every time when somebody will return it's tokens back during token distribution period
  * @param addr is an address of account. Pooling contract send tokens to this address
  * @param value is a sum in tokens which was sent from pooling
  */
  event ReleaseToken(address indexed addr, uint value);

}