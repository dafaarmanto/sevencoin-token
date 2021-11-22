pragma solidity ^0.4.2;

contract SevenCoin {
    // Name, symbol, and standard
    string public name = "SevenCoin";
    string public symbol = "SEVC";
    string public standard = "SevenCoin v1.0";

    event Transfer(address indexed _from, address indexed _to, uint256 _value);

    event Approval(
        address indexed _owner,
        address indexed _spender,
        uint256 _value
    );

    uint256 public totalSupply;

    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;

    function SevenCoin(uint256 _initialSupply) public {
        balanceOf[msg.sender] = _initialSupply;
        totalSupply = _initialSupply;
    }

    // Transfer token
    function transfer(address _to, uint256 _value)
        public
        returns (bool success)
    {
        // Exception
        require(balanceOf[msg.sender] >= _value);

        // Transfer Balance
        balanceOf[msg.sender] -= _value;
        balanceOf[_to] += _value;

        // Transfer Event
        Transfer(msg.sender, _to, _value);

        // Return Boolean
        return true;
    }

    // Delegated Transfer -- approve, transferFrom
    function approve(address _spender, uint256 _value)
        public
        returns (bool success)
    {
        allowance[msg.sender][_spender] = _value;
        Approval(msg.sender, _spender, _value);
        return true;
    }

    function transferFrom(
        address _from,
        address _to,
        uint256 _value
    ) public returns (bool success) {
        require(_value <= balanceOf[_from]);
        require(_value <= allowance[_from][msg.sender]);

        Transfer(_from, _to, _value);
        balanceOf[_from] -= _value;
        balanceOf[_to] += _value;
        allowance[_from][msg.sender] -= _value;

        return true;
    }
}
