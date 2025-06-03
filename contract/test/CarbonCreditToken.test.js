const { expect } = require("chai");
const { ethers } = require("hardhat");

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

describe("CarbonCreditToken", function () {
  let CarbonCreditToken, token;
  let owner, oracle, user1, user2;

  beforeEach(async function () {
    [owner, oracle, user1, user2] = await ethers.getSigners();

    CarbonCreditToken = await ethers.getContractFactory("CarbonCreditToken");
    token = await CarbonCreditToken.deploy("Carbon Credit Token", "CCT");
    await token.waitForDeployment();

    await token.setOracle(oracle.address);
  });

  it("should set oracle correctly", async function () {
    expect(await token.oracle()).to.equal(oracle.address);
  });

  it("should mint tokens if amount positive", async function () {
    await token.connect(oracle).updateCarbonCredit(user1.address, 100);
    expect(await token.balanceOf(user1.address)).to.equal(100);
    expect(await token.getDebt(user1.address)).to.equal(0);
  });

  it("should add debt if amount negative", async function () {
    await token.connect(oracle).updateCarbonCredit(user1.address, -50);
    expect(await token.balanceOf(user1.address)).to.equal(0);
    expect(await token.getDebt(user1.address)).to.equal(-50);
  });

  it("should handle mint then debt correctly", async function () {
    await token.connect(oracle).updateCarbonCredit(user1.address, 100);
    await token.connect(oracle).updateCarbonCredit(user1.address, -30);
    expect(await token.balanceOf(user1.address)).to.equal(100);
    expect(await token.getDebt(user1.address)).to.equal(-30);
  });

  it("should revert if zero address recipient", async function () {
    await expect(
      token.connect(oracle).updateCarbonCredit(ZERO_ADDRESS, 10)
    ).to.be.revertedWith("Invalid recipient");
  });

  it("should revert if amount is zero", async function () {
    await expect(
      token.connect(oracle).updateCarbonCredit(user1.address, 0)
    ).to.be.revertedWith("Amount cannot be zero");
  });

  it("should revert if called not by oracle", async function () {
    await expect(
      token.connect(user1).updateCarbonCredit(user2.address, 10)
    ).to.be.revertedWith("Caller is not oracle");
  });

  it("should allow owner to change oracle", async function () {
    await token.setOracle(user1.address);
    expect(await token.oracle()).to.equal(user1.address);
  });

  it("should revert oracle change if not owner", async function () {
    await expect(
      token.connect(user1).setOracle(user2.address)
    ).to.be.revertedWith("Ownable: caller is not the owner");
  });
});
