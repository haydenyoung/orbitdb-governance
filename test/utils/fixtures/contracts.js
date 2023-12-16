import createOrbitDBInstance from './orbitdb.js'

const [owner, proposer, voter1, voter2, voter3 ] = await ethers.getSigners()

async function deployGovernorFixture() {
  const orbitdb = await createOrbitDBInstance('proposer', proposer)

  const proposals = await orbitdb.open('proposal-1', { type: 'documents' })

  const lock = await deployTokenLockFixture()

  const Governor = await ethers.getContractFactory("Governor")
  const governor = await Governor.connect(proposer).deploy(await lock.getAddress(), proposals.address)
  await orbitdb.stop()
  await orbitdb.ipfs.stop()

  return [ governor, lock ]
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
  voter2,
  voter3,
  deployGovernorFixture,
  deployTokenLockFixture
}
