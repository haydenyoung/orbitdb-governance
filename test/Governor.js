const { loadFixture } = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");
const { expect } = require("chai");

describe("Governor", function () {
  async function deployGovernorFixture() {
    const [owner, proposer, voter1] = await ethers.getSigners();

    const Governor = await ethers.getContractFactory("Governor");
    const governor = await Governor.deploy();

    return { governor, owner, proposer, voter1 };
  }

  describe("Deployment", function () {
    it("should set the right owner", async function () {
      const { governor, owner } = await loadFixture(deployGovernorFixture);

      expect(await governor.owner()).to.equal(owner.address);
    });
  });
  
  describe("Proposals", function () {
    it("should put forward a proposal", async function () {
      const { governor, proposer } = await loadFixture(deployGovernorFixture);
      
      await governor.connect(proposer).propose(proposer, '/orbitdb/123', 'xyz')
      
      const proposal = await governor.proposals[0]
      
      expect(proposal, { proposer, dbAddress: '/orbitdb/123', proposalHash: 'xyz' });
    });
  });
  
  describe("Voting", function () {
    it("should hash votes", async function () {
      const { governor, proposer } = await loadFixture(deployGovernorFixture);
        
      await governor.connect(proposer).propose(proposer, '/orbitdb/123', 'xyz')
        
      const hash = await governor.hashVotes([{ voter: 123, tokens: 1 }])
      expect(hash, '0xabb0b6ee61567830244e44200caf8fcbfa6cdc9768ff24bf53881460f3cd58f7')
    });
    
    it("should ratify a proposal", async function () {
      const { governor, proposer } = await loadFixture(deployGovernorFixture);
      
      await governor.connect(proposer).propose(proposer, '/orbitdb/123', 'xyz')
      
      const hash = await governor.hashVotes([{ voter: 123, tokens: 1 }])

      const signedMessage = await proposer.signMessage(hash)
      
      await governor.connect(proposer).ratify(0, signedMessage)
      
      const ratification = governor.ratifications[0]

      expect(ratification, signedMessage)
    });
  });  
});
