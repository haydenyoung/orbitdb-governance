import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers.js";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs.js";
import { expect } from "chai";
import { createProposerOrbitDB, createVoterOrbitDB  } from "./utils/fixtures/orbitdb.js"
import { useAccessController, Documents } from "@orbitdb/core"
import GovernorAccessController from './utils/governor-access-controller.js'
import { owner, proposer, voter1, deployGovernorFixture, deployTokenLockFixture } from './utils/fixtures/contracts.js'

describe("Governor", function () {
  let governor, tokenLock

  before(async function () {
    governor = await loadFixture(deployGovernorFixture)
    tokenLock = await loadFixture(deployTokenLockFixture)
  })

  describe("Deployment", function () {
    it("should set the right owner", async function () {
      expect(await governor.owner()).to.equal(owner.address)
    });
  });

  describe("Governance", function () {
    let orbitdb1

    before(async function () {
      orbitdb1 = await createProposerOrbitDB()
    })

    after(async function () {
      await orbitdb1.stop()
      await orbitdb1.ipfs.stop()
    })

    let proposals, votes

    const title = 'Proposal 1'
    const description = 'Use OrbitDB for off-chain governance.'

    beforeEach(async function () {
      const AccessController = GovernorAccessController(await tokenLock.getAddress())
      useAccessController(GovernorAccessController)

      proposals = await orbitdb1.open('proposal-1', { type: 'documents' })
      votes = await orbitdb1.open('proposal-1-votes', { type: 'documents', Database: Documents({ indexBy: 'voter' }), AccessController })

      proposals.events.on('join', (peerId, heads) => {
        console.log('New peer joined', peerId.toString())
      })

      votes.events.on('update', event => {
        console.log('New vote cast', event)
      })
    })

    afterEach(async function () {
      await votes.drop()
      await proposals.drop()
      await votes.close()
      await proposals.close()
    })

    describe("Proposals", function () {
      it("should put forward a proposal", async function () {
        const governor = await loadFixture(deployGovernorFixture);

        const proposal = { _id: 1, title, description, votes_db_address: votes.address }
        const proposalHash = await proposals.put(proposal)

        await governor.connect(proposer).propose(proposer, proposals.address, proposalHash)

        const expected = { proposer, dbAddress: proposals.address, proposalHash }

        expect(await governor.proposals[0], expected)
      });
    });

    describe("Voting", function () {
      let orbitdb2
      let proposalHash
      let proposals2, votes2

      before(async function () {
        orbitdb2 = await createVoterOrbitDB()

        await orbitdb2.ipfs.swarm.connect((await orbitdb1.ipfs.id()).addresses[0])
      })

      after(async function () {
        proposals2.close()
        votes2.close()
        orbitdb2.stop()
      })

      beforeEach(async function () {
        proposals2 = await orbitdb2.open(proposals.address)
        votes2 = await orbitdb2.open(votes.address)

        await tokenLock.connect(voter1).lock(voter1, 100, 10)

        const governor = await loadFixture(deployGovernorFixture);

        const proposal = { _id: 1, title, description, votes_db_address: votes.address }

        proposalHash = await proposals.put(proposal)

        await governor.connect(proposer).propose(proposer, proposals.address, proposalHash)
      })

      it("should hash votes", async function () {
        const governor = await loadFixture(deployGovernorFixture);

        const hash = await governor.hashVotes([{ voter: voter1, tokens: 1 }])
        expect(hash, '0xabb0b6ee61567830244e44200caf8fcbfa6cdc9768ff24bf53881460f3cd58f7')
      });

      it("should ratify a proposal", async function () {
        const governor = await loadFixture(deployGovernorFixture);

        await votes.put({ voter: await voter1.getAddress(), tokens: 10 })

        const hash = await governor.hashVotes((await votes.all()).map(e => e.value))

        const signedMessage = await proposer.signMessage(hash)

        await governor.connect(proposer).ratify(0, signedMessage)

        const ratification = governor.ratifications[0]

        expect(ratification, signedMessage)
      })

      it("should not be able to double vote", async function () {
        await votes.put({ voter: await voter1.getAddress(), tokens: 10 })
        await votes.put({ voter: await voter1.getAddress(), tokens: 20 })

        expect(await votes.all().length, 1)
      })
    })
  })
})
