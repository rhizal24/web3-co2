// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract CarbonCreditToken is ERC20, Ownable {
    address public oracle;

    mapping(address => int256) public carbonDebt;

    event OracleUpdated(address indexed oldOracle, address indexed newOracle);
    event Minted(address indexed to, uint256 amount);
    event DebtUpdated(address indexed user, int256 debt);

    constructor(string memory name_, string memory symbol_) ERC20(name_, symbol_) {}

    modifier onlyOracle() {
        require(msg.sender == oracle, "Caller is not oracle");
        _;
    }

    function setOracle(address _oracle) external onlyOwner {
        require(_oracle != address(0), "Invalid oracle address");
        address old = oracle;
        oracle = _oracle;
        emit OracleUpdated(old, _oracle);
    }

    function updateCarbonCredit(address to, int256 amount) external onlyOracle {
        require(to != address(0), "Invalid recipient");
        require(amount != 0, "Amount cannot be zero");

        if (amount > 0) {
            _mint(to, uint256(amount));
            emit Minted(to, uint256(amount));
        } else {
            carbonDebt[to] += amount; 
            emit DebtUpdated(to, carbonDebt[to]);
        }
    }

    function getDebt(address user) external view returns (int256) {
        return carbonDebt[user];
    }
}