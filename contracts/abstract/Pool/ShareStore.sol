pragma solidity ^0.4.23;


import "./IStateModel.sol";
import "./IRoleModel.sol";
import "./IShareStore.sol";
import "../../libs/math/SafeMath.sol";
import "../../libs/token/ERC20/IERC20.sol";


contract ShareStore is IRoleModel, IShareStore, IStateModel {
  using SafeMath for uint;
  uint public minimalDeposit;


  address public tokenAddress;

  mapping (address=>uint) public share;
  mapping (address=>uint) internal etherReleased_;
  mapping (address=>uint) internal tokenReleased_;

  uint public totalShare;
  uint public totalToken;
  
  mapping (uint8=>uint) public stakeholderShare;
  mapping (uint8=>uint) internal stakeholderEtherReleased_;



  uint constant DECIMAL_MULTIPLIER = 1e18;


  function getTotalEther_() internal view returns(uint){
    return totalShare;
  }


  function buyShare_(uint8 _state) internal returns(bool){
    require(_state == ST_RAISING);
    require(msg.value >= minimalDeposit);
    share[msg.sender] = share[msg.sender].add(msg.value);
    emit BuyShare(msg.sender, msg.value);
    totalShare = totalShare.add(msg.value);
    return true;
  }

  function acceptTokenFromICO_(uint8 _state, uint _value) internal returns(bool) {
    require(_state == ST_WAIT_FOR_ICO);
    totalToken = totalToken.add(_value);
    emit AcceptTokenFromICO(msg.sender, _value);
    require(IERC20(tokenAddress).transferFrom(msg.sender, this, _value));
    return true;
  }

  function getStakeholderBalanceOf_(uint8 _for) internal view returns (uint){
    if (_for == RL_ICO_MANAGER) {
      return getTotalEther_().mul(stakeholderShare[_for]).div(DECIMAL_MULTIPLIER).sub(stakeholderEtherReleased_[_for]);
    }

    if ((_for == RL_POOL_MANAGER) || (_for == RL_ADMIN)) {
      return stakeholderEtherReleased_[RL_ICO_MANAGER].mul(stakeholderShare[_for]).div(stakeholderShare[RL_ICO_MANAGER]);
    }
    return 0;
  }

  function releaseEtherToStakeholder_(uint8 _state, uint8 _for, address _afor, uint _value) internal returns (bool) {
    require(_for != RL_DEFAULT);
    require(_for != RL_PAYBOT);
    require(!((_for == RL_ICO_MANAGER) && (_state != ST_WAIT_FOR_ICO)));
    uint _balance = getStakeholderBalanceOf_(_for);
    require(_balance >= _value);
    stakeholderEtherReleased_[_for] = stakeholderEtherReleased_[_for].add(_value);
    emit ReleaseEtherToStakeholder(_for, _afor, _value);
    _afor.transfer(_value);
    return true;
  }

  function getBalanceEtherOf_(address _for) internal view returns (uint) {
    uint _stakeholderTotalEtherReserved = stakeholderEtherReleased_[RL_ICO_MANAGER].mul(DECIMAL_MULTIPLIER).div(stakeholderShare[RL_ICO_MANAGER]);
    uint _restEther = getTotalEther_().sub(_stakeholderTotalEtherReserved);
    return _restEther.mul(share[_for]).div(totalShare).sub(etherReleased_[_for]);
  }

  function getBalanceTokenOf_(address _for) internal view returns (uint) {
    return totalToken.mul(share[_for]).div(totalShare).sub(etherReleased_[_for]);
  }

  function releaseEther_(uint8 _state, address _for, uint _value) internal returns (bool) {
    uint _balance = getBalanceEtherOf_(_for);
    require((_state == ST_MONEY_BACK) || (_state == ST_TOKEN_DISTRIBUTION));
    require(_balance >= _value);
    etherReleased_[_for] = etherReleased_[_for].add(_value);
    emit ReleaseEther(_for, _value);
    _for.transfer(_value);
    return true;
  }

  function releaseToken_(uint8 _state, address _for, uint _value) internal returns (bool) {
    uint _balance = getBalanceTokenOf_(_for);
    require((_state == ST_MONEY_BACK) || (_state == ST_TOKEN_DISTRIBUTION));
    require(_balance >= _value);
    tokenReleased_[_for] = tokenReleased_[_for].add(_value);
    emit ReleaseToken(_for, _value);
    require(IERC20(tokenAddress).transfer(_for, _value));
    return true;
  }

  function refundShare_(uint8 _state, address _for, uint _value) internal returns(bool){
    require(_state == ST_RAISING);
    uint _balance = share[_for];
    require(_balance >= _value);
    share[_for] = _balance.sub(_value);
    totalShare = totalShare.sub(_value);
    emit RefundShare(_for, _value);
    _for.transfer(_value);
    return true;
  }


  function buyShare() external payable returns(bool) {
    return buyShare_(getState_());
  }

  function acceptTokenFromICO(uint _value) external returns(bool) {
    require(getRole_() == RL_ICO_MANAGER);
    return acceptTokenFromICO_(getState_(), _value);
  }

  function getStakeholderBalanceOf(uint8 _for) external view returns(uint) {
    return getStakeholderBalanceOf_(_for);
  }

  function getBalanceEtherOf(address _for) external view returns(uint) {
    return getBalanceEtherOf_(_for);
  }

  function getBalanceTokenOf(address _for) external view returns(uint) {
    return getBalanceTokenOf_(_for);
  }

  function releaseEtherToStakeholder(uint _value) external returns(bool) {
    return releaseEtherToStakeholder_(getState_(), getRole_(), msg.sender, _value);
  }

  function releaseEtherToStakeholderForce(address _afor, uint _value) external returns(bool) {
    uint8 _role = getRole_();
    uint8 _for = getRole_(_afor);
    require((_role==RL_ADMIN) || (_role==RL_PAYBOT));
    return releaseEtherToStakeholder_(getState_(), _for, _afor, _value);
  }

  function releaseEther(uint _value) external returns(bool) {
    return releaseEther_(getState_(), msg.sender, _value);
  }

  function releaseEtherForce(address _for, uint _value) external returns(bool) {
    uint8 _role = getRole_();
    require((_role==RL_ADMIN) || (_role==RL_PAYBOT));
    return releaseEther_(getState_(), _for, _value);
  }

  function releaseToken(uint _value) external returns(bool) {
    return releaseToken_(getState_(), msg.sender, _value);
  }

  function releaseTokenForce(address _for, uint _value) external returns(bool) {
    uint8 _role = getRole_();
    require((_role==RL_ADMIN) || (_role==RL_PAYBOT));
    return releaseToken_(getState_(), _for, _value);
  }

  function () public payable {
    uint8 _state = getState_();
    if (_state == ST_RAISING){
      buyShare_(_state);
      return;
    }

    if (_state == ST_MONEY_BACK) {
      releaseEther_(_state, msg.sender, getBalanceEtherOf_(msg.sender));
      return;
    }

    if (_state == ST_TOKEN_DISTRIBUTION) {
      releaseEther_(_state, msg.sender, getBalanceEtherOf_(msg.sender));
      releaseToken_(_state, msg.sender, getBalanceTokenOf_(msg.sender));
      return;
    }
    revert();
  }





}