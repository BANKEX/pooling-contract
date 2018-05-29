pragma solidity ^0.4.23;


contract IShareStore{
  function getTotalShare_() internal view returns(uint);

  event BuyShare(address indexed addr, uint value);
  event RefundShare(address indexed addr, uint value);

  event ReleaseEtherToStakeholder(uint8 indexed role, address indexed addr, uint value);
  event AcceptTokenFromICO(address indexed addr, uint value);

  event ReleaseEther(address indexed addr, uint value);
  event ReleaseToken(address indexed addr, uint value);

}