import createOrbitDBInstance from './orbitdb.js'

const [owner, proposer, voter1, voter2, voter3 ] = await ethers.getSigners()

async function deployTokenFixture () {
  const Token = await ethers.getContractFactory("GovernanceToken")
  const token = await Token.connect(proposer).deploy()

  await token.connect(proposer).transfer(voter1, '10000000000000000000000')
  await token.connect(proposer).transfer(voter2, '10000000000000000000000')
  await token.connect(proposer).transfer(voter3, '10000000000000000000000')

  return token
}

async function deployGovernorFixture() {
  const orbitdb = await createOrbitDBInstance('proposer', proposer)

  const proposals = await orbitdb.open('proposal-1', { type: 'documents' })

  const [ lock, ] = await deployTokenLockFixture()

  const Governor = await ethers.getContractFactory("Governor")
  const governor = await Governor.connect(proposer).deploy(await lock.getAddress(), proposals.address)
  await orbitdb.stop()
  await orbitdb.ipfs.stop()

  return [ governor, lock ]
}

async function deployTokenLockFixture() {
  const token = await deployTokenFixture()

  const TokenLock = await ethers.getContractFactory("TokenLock")
  const tokenLock = await TokenLock.connect(proposer).deploy(token)

  await token.connect(voter1).approve(await tokenLock.getAddress(), '10000000000000000000000')
  await token.connect(voter2).approve(await tokenLock.getAddress(), '10000000000000000000000')
  await token.connect(voter3).approve(await tokenLock.getAddress(), '10000000000000000000000')

  return [ tokenLock, token ]
}

export {
  owner,
  proposer,
  voter1,
  voter2,
  voter3,
  deployTokenFixture,
  deployGovernorFixture,
  deployTokenLockFixture
}
