import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers.js"
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs.js"
import { expect } from "chai"
import { OrbitDBAccessController } from "@orbitdb/core"
import { owner, proposer, voter1, deployTokenLockFixture } from './utils/fixtures/contracts.js'

describe("TokenLock", function () {
  describe("Deployment", function () {
    it("should set the right owner", async function () {
      const tokenLock = await loadFixture(deployTokenLockFixture);

      expect(await tokenLock.owner()).to.equal(owner.address);
    });
  });

  describe("Staking", function () {
    it("should lock some tokens", async function () {
      const tokenLock = await loadFixture(deployTokenLockFixture);

      await tokenLock.connect(voter1).lock(voter1, 100, 10)

      const expected = { voter: voter1, tokens: 100, duration: 10 }

      expect(await tokenLock.stakes[voter1], expected)
    });
  });

  describe("Voting", function () {
    it("should be able to vote", async function () {
      const tokenLock = await loadFixture(deployTokenLockFixture);

      await tokenLock.connect(voter1).lock(voter1, 100, 10)

      expect(await tokenLock.canVote(voter1), true)
    });
  });
})
