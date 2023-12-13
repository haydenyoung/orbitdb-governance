import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers.js";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs.js";
import { expect } from "chai";
import { useAccessController, Documents } from "@orbitdb/core"
import createOrbitDBInstance from "./utils/fixtures/orbitdb.js"
import GovernorAccessController from './utils/governor-access-controller.js'
import { owner, proposer, voter1, deployGovernorFixture, deployTokenLockFixture } from './utils/fixtures/contracts.js'
import { rimraf } from 'rimraf'

describe("Governor", function () {
  let governor, tokenLock

  beforeEach(async function () {
    [ governor, tokenLock ]  = await loadFixture(deployGovernorFixture)
  })

  describe("Deployment", function () {
    it("should set the right owner", async function () {
      expect(await governor.owner()).to.equal(proposer.address)
    })
  })

  describe("Governance", function () {
    let orbitdb1
    let proposals, votes

    const title = 'Proposal 1'
    const description = 'Use OrbitDB for off-chain governance.'

    beforeEach(async function () {
      const AccessController = GovernorAccessController(await governor.getAddress())
      useAccessController(GovernorAccessController)

      orbitdb1 = await createOrbitDBInstance('proposer', proposer)

      proposals = await orbitdb1.open('proposal-1', { type: 'documents' })
      votes = await orbitdb1.open('proposal-1-votes', { type: 'documents', Database: Documents({ indexBy: 'voter' }), AccessController })
    })

    afterEach(async function () {
      await orbitdb1.stop()
      await rimraf('./orbitdb/proposer')
    })

    describe("Proposals", function () {
      it("should put forward a proposal", async function () {

        const proposal = { _id: 1, title, description, votes_db_address: votes.address }
        const proposalHash = await proposals.put(proposal)

        await governor.connect(proposer).propose(proposalHash)

        const abiCoder = new ethers.AbiCoder()
        const actual = await governor.proposals(ethers.keccak256(abiCoder.encode(['string'], [proposalHash])))

        expect(actual[0]).to.equal(ethers.getBigInt(0))
        expect(actual[1]).to.equal(proposalHash)
        expect(actual[2]).to.equal('')
      })
    })

    describe("Voting", function () {
      let orbitdb2
      let proposalHash
      let proposals2, votes2

      beforeEach(async function () {
        orbitdb2 = await createOrbitDBInstance('voter1', voter1)

        await orbitdb2.ipfs.libp2p.peerStore.save(orbitdb1.ipfs.libp2p.peerId, { multiaddrs: await orbitdb1.ipfs.libp2p.getMultiaddrs() })
        await orbitdb2.ipfs.libp2p.dial(orbitdb1.ipfs.libp2p.peerId)

        proposals2 = await orbitdb2.open(proposals.address)
        votes2 = await orbitdb2.open(votes.address, { Database: Documents({ indexBy: 'voter' }) })

        await tokenLock.connect(voter1).lock(voter1, 100, 10)

        const proposal = { _id: 1, title, description, votes_db_address: votes.address }

        proposalHash = await proposals.put(proposal)
        await governor.connect(proposer).propose(proposalHash)
      })

      afterEach(async function () {
        await orbitdb2.stop()
        await rimraf('./orbitdb/voter1')
      })

      it("should hash votes", async function () {
        const hash = await governor.hashVotes([{ voter: voter1, tokens: 1, selection: 1 }])

        expect(hash).to.equal('0x3e988a2c1017c9edfdfcae0d4a3b73de5511c85f851cb7a75917231c9dc24ade')
      })

      it("should ratify a proposal", async function () {
        await votes2.put({ voter: await voter1.getAddress(), tokens: 10, selection: 1 })

        const hash = await governor.hashVotes((await votes.all()).map(e => e.value))

        const signedMessage = await proposer.signMessage(hash)

        await governor.connect(proposer).ratify(proposalHash, signedMessage)

        const abiCoder = new ethers.AbiCoder()
        const ratification = (await governor.proposals(ethers.keccak256(abiCoder.encode(['string'], [proposalHash])))).ratified

        expect(ratification).to.equal(signedMessage)
      })

      it("should update a vote", async function () {
        await votes2.put({ voter: await voter1.getAddress(), tokens: 10, selection: 1 })
        await votes2.put({ voter: await voter1.getAddress(), tokens: 20, selection: 2 })

        expect((await votes2.all()).length).to.equal(1)

        await new Promise((resolve, reject) => {
          const interval = setInterval(async () => {
            const records = await votes.all()
            if (records.length === 1) {
              clearInterval(interval)
              resolve()
            }
          }, 1000)
        })

        expect((await votes.all()).length).to.equal(1)
      })

      it("should verify the outcome using voter's db", async function () {
        await votes2.put({ voter: await voter1.getAddress(), tokens: 10, selection: 5 })

        await new Promise((resolve, reject) => {
          const interval = setInterval(async () => {
            const records = await votes.all()
            if (records.length === 1) {
              clearInterval(interval)
              resolve()
            }
          }, 1000)
        })

        const hash = await governor.hashVotes((await votes.all()).map(e => e.value))

        const signedMessage = await proposer.signMessage(hash)

        await governor.connect(proposer).ratify(proposalHash, signedMessage)

        const ratification = (await governor.proposals(await governor.proposalsIndex(0))).ratified

        const expectedHash = await governor.hashVotes((await votes2.all()).map(e => e.value))

        expect(hash).to.equal(expectedHash)
      })
    })
  })
})
