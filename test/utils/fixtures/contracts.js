import { createProposerOrbitDB } from './orbitdb.js'

const [owner, proposer, voter1] = await ethers.getSigners()

async function deployGovernorFixture() {
  const orbitdb = await createProposerOrbitDB()
  const proposals = await orbitdb.open('proposal-1', { type: 'documents' })

  const Governor = await ethers.getContractFactory("Governor")
  const governor = await Governor.connect(proposer).deploy(proposals.address)

  await orbitdb.stop()
  await orbitdb.ipfs.stop()

  return governor
}

async function deployTokenLockFixture() {
  const TokenLock = await ethers.getContractFactory("TokenLock")
  const tokenLock = await TokenLock.deploy()

  return tokenLock
}

export {
  owner,
  proposer,
  voter1,
  deployGovernorFixture,
  deployTokenLockFixture
}
