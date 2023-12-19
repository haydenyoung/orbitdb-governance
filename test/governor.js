import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers.js";
import { expect } from "chai";
import { useAccessController, Documents } from "@orbitdb/core"
import createOrbitDBInstance from "./utils/fixtures/orbitdb.js"
import GovernorAccessController from './utils/governor-access-controller.js'
import { owner, proposer, voter1, voter2, voter3, deployGovernorFixture, deployTokenLockFixture } from './utils/fixtures/contracts.js'
import { rimraf } from 'rimraf'

describe("Governor", function () {
  const votingOptions = {
    1: 'yes',
    2: 'no'
  }

  let governor, tokenLock

  after(async function () {
    await rimraf('./orbitdb')
  })

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
    let proposals

    const title = 'Proposal 1'
    const description = 'Use OrbitDB for off-chain governance.'

    beforeEach(async function () {
      orbitdb1 = await createOrbitDBInstance('proposer', proposer)

      proposals = await orbitdb1.open('proposal-1', { type: 'documents' })
    })

    afterEach(async function () {
      await orbitdb1.stop()
      await rimraf('./orbitdb/proposer')
    })

    describe("Proposals", function () {
      it("should put forward a proposal", async function () {
        const proposal = { _id: 1, title, description, options: votingOptions }
        const proposalHash = await proposals.put(proposal)

        await governor.connect(proposer).propose(proposalHash)

        const abiCoder = new ethers.AbiCoder()
        const actual = await governor.proposals(ethers.keccak256(abiCoder.encode(['string'], [proposalHash])))

        expect(actual[0]).to.equal(ethers.getBigInt(0))
        expect(actual[1]).to.equal(proposalHash)
        expect(actual[2]).to.equal(ethers.getBigInt(10))
        expect(actual[3]).to.equal(ethers.getBigInt(110))
        expect(actual[4]).to.equal('')
      })
    })

    describe("Voting", function () {
      let orbitdb2
      let proposalHash
      let proposals2
      let votes, votes2

      beforeEach(async function () {
        const proposal = { _id: 1, title, description }
        proposalHash = await proposals.put(proposal)
        await governor.connect(proposer).propose(proposalHash)

        const AccessController = GovernorAccessController({ governorAddress: await governor.getAddress(), proposalId: proposalHash })
        useAccessController(GovernorAccessController)

        votes = await orbitdb1.open('proposal-1-votes', { type: 'documents', Database: Documents({ indexBy: 'voter' }), AccessController })

        orbitdb2 = await createOrbitDBInstance('voter1', voter1)

        await orbitdb2.ipfs.libp2p.peerStore.save(orbitdb1.ipfs.libp2p.peerId, { multiaddrs: await orbitdb1.ipfs.libp2p.getMultiaddrs() })
        await orbitdb2.ipfs.libp2p.dial(orbitdb1.ipfs.libp2p.peerId)

        proposals2 = await orbitdb2.open(proposals.address)
        votes2 = await orbitdb2.open(votes.address, { Database: Documents({ indexBy: 'voter' }) })

        await tokenLock.connect(voter1).lock(voter1, 100, 200)
      })

      afterEach(async function () {
        await orbitdb2.stop()
        await rimraf('./orbitdb/voter1')
      })

      it("should hash votes", async function () {
        const hash = await governor.hashVotes([{ voter: voter1, tokens: 1, selection: 1 }])

        expect(hash).to.equal('0x3e988a2c1017c9edfdfcae0d4a3b73de5511c85f851cb7a75917231c9dc24ade')
      })

      it("should be able to vote", async function () {
        await tokenLock.connect(voter1).lock(voter1, 100, 200)

        expect(await governor.canVote(proposalHash, voter1, 10), true)
      });

      it("should publish votes", async function () {
        await votes2.put({ voter: await voter1.getAddress(), tokens: 10, selection: 1 })

        const votesHash = await governor.hashVotes((await votes.all()).map(e => e.value))

        await governor.connect(proposer).publishVotes(proposalHash, votesHash)

        const abiCoder = new ethers.AbiCoder()
        const finalVotes = (await governor.proposals(ethers.keccak256(abiCoder.encode(['string'], [proposalHash])))).votes

        expect(finalVotes).to.equal(votesHash)
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

      it("should not allow a vote with excess token weight", async function () {
        await expect(votes2.put({ voter: await voter1.getAddress(), tokens: 1000, selection: 1 })).to.be.rejectedWith(/Could not append entry:\nKey \".+\" is not allowed to write to the log/)
      })

      it("should not allow a vote which is cast outside the voting window", async function () {
        await expect(votes2.put({ voter: await voter1.getAddress(), tokens: 1000, selection: 1 })).to.be.rejectedWith(/Could not append entry:\nKey \".+\" is not allowed to write to the log/)
      })

      describe('Tallying results', function () {
        let orbitdb3, orbitdb4
        let votes3, votes4

        beforeEach(async function () {
          orbitdb3 = await createOrbitDBInstance('voter2', voter2)

          await orbitdb3.ipfs.libp2p.peerStore.save(orbitdb1.ipfs.libp2p.peerId, { multiaddrs: await orbitdb1.ipfs.libp2p.getMultiaddrs() })
          await orbitdb3.ipfs.libp2p.dial(orbitdb1.ipfs.libp2p.peerId)

          votes3 = await orbitdb3.open(votes.address, { Database: Documents({ indexBy: 'voter' }) })

          orbitdb4 = await createOrbitDBInstance('voter3', voter3)

          await orbitdb4.ipfs.libp2p.peerStore.save(orbitdb1.ipfs.libp2p.peerId, { multiaddrs: await orbitdb1.ipfs.libp2p.getMultiaddrs() })
          await orbitdb4.ipfs.libp2p.dial(orbitdb1.ipfs.libp2p.peerId)

          votes4 = await orbitdb4.open(votes.address, { Database: Documents({ indexBy: 'voter' }) })
        })

        afterEach(async function () {
          await orbitdb3.stop()
          await orbitdb4.stop()

          await rimraf('./orbitdb/voter2')
          await rimraf('./orbitdb/voter3')
        })

        it("should count the votes and save the results", async function () {
          await votes2.put({ voter: voter1.address, tokens: 10, selection: 1 })

          await tokenLock.connect(voter2).lock(voter2, 100, 200)

          await votes3.put({ voter: voter2.address, tokens: 10, selection: 1 })

          await tokenLock.connect(voter3).lock(voter3, 100, 200)

          await votes4.put({ voter: voter3.address, tokens: 10, selection: 2 })

          await new Promise((resolve, reject) => {
            const interval = setInterval(async () => {
              const records = await votes.all()
              if (records.length === 3) {
                clearInterval(interval)
                resolve()
              }
            }, 1000)
          })

          const ballotCount = {}

          Object.keys(votingOptions).forEach(key => {
            ballotCount[key] = 0
          })

          for await (const v of votes.iterator()) {
            if (Object.keys(votingOptions).some(option => parseInt(option) === parseInt(v.value.selection))) {
              ballotCount[v.value.selection] += parseInt(v.value.tokens)
            }
          }

          expect(ballotCount).is.deep.equal({ '1': 20, '2': 10 })
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

          await governor.connect(proposer).publishVotes(proposalHash, hash)

          const finalVotes = (await governor.proposals(await governor.proposalsIndex(0))).votes

          const expectedHash = await governor.hashVotes((await votes2.all()).map(e => e.value))

          expect(finalVotes).to.equal(expectedHash)
        })

        it("should not hijack the vote of another voter", async function () {
          await tokenLock.connect(voter2).lock(voter2, 100, 200)

          await expect(votes2.put({ voter: voter2.address, tokens: 1000, selection: 1 })).to.be.rejectedWith(/Could not append entry:\nKey \".+\" is not allowed to write to the log/)
        })

        describe('Contest results', function () {
          it("should contest a vote", async function () {
            await votes2.put({ voter: voter1.address, tokens: 10, selection: 5 })

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

            await governor.connect(proposer).publishVotes(proposalHash, hash)

            const contestHash = await governor.hashVotes([{ voter: await voter1.getAddress(), tokens: 11, selection: 5 }])

            await governor.connect(voter1).contest(proposalHash, contestHash)

            const abiCoder = new ethers.AbiCoder()

            const contests = []
            const proposalHashBytes32 = ethers.keccak256(abiCoder.encode(['string'], [proposalHash]))
            for (let i = 0; i < await governor.contestCount(proposalHashBytes32); i++) {
              contests.push(await governor.contests(proposalHashBytes32, i))
            }

            expect(contests).to.deep.equal([[voter1.address, contestHash]])
          })
        })
      })
    })
  })
})
