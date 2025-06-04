const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("CarbonCreditToken", function () {
  let Token, token, owner, oracle, addr1;

  beforeEach(async function () {
    Token = await ethers.getContractFactory("CarbonCreditToken");
    [owner, oracle, addr1] = await ethers.getSigners();
    token = await Token.deploy("Carbon Credit Token", "CCT");
    await token.deployed();

    await token.setOracle(oracle.address);
  });

  it("should mint tokens based on oracle data", async function () {
    const amountToMint = 50;

    await token.connect(oracle).updateCarbonCredit(addr1.address, amountToMint);

    expect(await token.balanceOf(addr1.address)).to.equal(amountToMint);
  });

  it("should not allow non-oracle to mint tokens", async function () {
    const amountToMint = 50;

    await expect(
      token.connect(addr1).updateCarbonCredit(addr1.address, amountToMint)
    ).to.be.revertedWith("Caller is not oracle");
  });

  it("should update debt for over-emission", async function () {
    const debt = -20;

    await token.connect(oracle).updateCarbonCredit(addr1.address, debt);

    const updatedDebt = await token.carbonDebt(addr1.address);
    expect(updatedDebt).to.equal(debt);
  });
});
