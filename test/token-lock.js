import { loadFixture, mine } from "@nomicfoundation/hardhat-toolbox/network-helpers.js"
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs.js"
import { expect } from "chai"
import { OrbitDBAccessController } from "@orbitdb/core"
import { owner, proposer, voter1, deployTokenLockFixture } from './utils/fixtures/contracts.js'

describe("TokenLock", function () {
  describe("Deployment", function () {
    it("should set the right owner", async function () {
      const [ tokenLock ] = await loadFixture(deployTokenLockFixture);

      expect(await tokenLock.owner()).to.equal(proposer.address);
    });
  });

  describe("Staking", function () {
    it("should lock some tokens", async function () {
      const [ tokenLock ] = await loadFixture(deployTokenLockFixture);

      await tokenLock.connect(voter1).lock(100, 10)

      const expected = { voter: voter1, tokens: 100, end: 10 }

      expect(await tokenLock.stakes(voter1.address), expected)
    });

    it("should unlock locked tokens", async function () {
      const [ tokenLock ] = await loadFixture(deployTokenLockFixture);

      await tokenLock.connect(voter1).lock(100, 10)

      await mine(10)

      await tokenLock.connect(voter1).unlock(100)

      const actual = await tokenLock.stakes(voter1.address)

      expect(actual[0]).is.equal(voter1.address)
      expect(actual[1]).is.equal(0)
      expect(actual[2]).is.equal(0)
    });

    it("should not unlock tokens before lock period has expired", async function () {
      const [ tokenLock ] = await loadFixture(deployTokenLockFixture);

      await tokenLock.connect(voter1).lock(100, 10)

      await expect(tokenLock.connect(voter1).unlock(100)).to.be.revertedWith('TokenLock: duration is less than block number')
    });
  });
})
