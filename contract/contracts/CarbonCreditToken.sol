// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract CarbonCreditToken is ERC20, Ownable {
    address public oracle;

    mapping(address => int256) public carbonDebt;
    mapping(string => bool) public usedProjects;

    event OracleUpdated(address indexed oldOracle, address indexed newOracle);
    event CarbonCreditMinted(address indexed to, uint256 amount, string projectId);
    event CarbonDebtBurned(address indexed from, uint256 amount);
    event DebtUpdated(address indexed user, int256 debt);
    event CarbonCreditTransfer(address indexed from, address indexed to, uint256 amount);

    constructor(string memory name_, string memory symbol_) ERC20(name_, symbol_) Ownable() {}

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
            emit CarbonCreditMinted(to, uint256(amount), "");
        } else {
            carbonDebt[to] += amount; 
            emit DebtUpdated(to, carbonDebt[to]);
        }
    }

    function mintCarbonCredit(address to, uint256 amount, string memory projectId) external onlyOracle returns (bool) {
        require(to != address(0), "Invalid recipient");
        require(amount > 0, "Amount must be positive");
        require(!usedProjects[projectId], "Project already used");

        usedProjects[projectId] = true;
        _mint(to, amount);
        emit CarbonCreditMinted(to, amount, projectId);
        return true;
    }

    function burnCarbonDebt(address from, uint256 amount) external onlyOracle returns (bool) {
        require(from != address(0), "Invalid address");
        require(balanceOf(from) >= amount, "Insufficient balance to burn");

        _burn(from, amount);
        carbonDebt[from] -= int256(amount);
        emit CarbonDebtBurned(from, amount);
        emit DebtUpdated(from, carbonDebt[from]);
        return true;
    }

    function getCarbonDebt(address user) external view returns (int256) {
        return carbonDebt[user];
    }

    function getDebt(address user) external view returns (int256) {
        return carbonDebt[user];
    }

    function isProjectUsed(string memory projectId) external view returns (bool) {
        return usedProjects[projectId];
    }

    // Enhanced transfer functions with debt checking
    function transfer(address to, uint256 amount) public virtual override returns (bool) {
        require(to != address(0), "Transfer to zero address");
        require(amount > 0, "Transfer amount must be positive");
        require(balanceOf(msg.sender) >= amount, "Insufficient balance");
        
        // Check carbon debt - user dengan debt negatif tidak bisa transfer
        require(carbonDebt[msg.sender] >= 0, "Cannot transfer with outstanding carbon debt");
        
        bool success = super.transfer(to, amount);
        
        if (success) {
            emit CarbonCreditTransfer(msg.sender, to, amount);
        }
        
        return success;
    }

    function transferFrom(address from, address to, uint256 amount) public virtual override returns (bool) {
        require(from != address(0), "Transfer from zero address");
        require(to != address(0), "Transfer to zero address");
        require(amount > 0, "Transfer amount must be positive");
        require(balanceOf(from) >= amount, "Insufficient balance");
        
        // Check carbon debt untuk sender
        require(carbonDebt[from] >= 0, "Cannot transfer with outstanding carbon debt");
        
        bool success = super.transferFrom(from, to, amount);
        
        if (success) {
            emit CarbonCreditTransfer(from, to, amount);
        }
        
        return success;
    }

    // Function untuk approve spending (required untuk transferFrom)
    function approve(address spender, uint256 amount) public virtual override returns (bool) {
        require(spender != address(0), "Approve to zero address");
        require(carbonDebt[msg.sender] >= 0, "Cannot approve with outstanding carbon debt");
        
        return super.approve(spender, amount);
    }

    // Helper function untuk cek apakah user bisa transfer
    function canTransfer(address user) external view returns (bool) {
        return carbonDebt[user] >= 0 && balanceOf(user) > 0;
    }

    // Helper function untuk cek transfer amount validity
    function canTransferAmount(address user, uint256 amount) external view returns (bool) {
        return carbonDebt[user] >= 0 && balanceOf(user) >= amount && amount > 0;
    }
}