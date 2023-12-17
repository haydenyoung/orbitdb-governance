import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers.js"
import { expect } from "chai"
import { deployTokenFixture } from './utils/fixtures/contracts.js'

describe("Token", function () {
  it("should deploy a token", async function () {
    const token = await deployTokenFixture()
    expect(await token.totalSupply()).to.be.equal('1000000000000000000000000')
  })
})
