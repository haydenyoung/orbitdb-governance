const [owner, proposer, voter1] = await ethers.getSigners()

const deployGovernorFixture = async () => {
  const Governor = await ethers.getContractFactory("Governor")
  const governor = await Governor.deploy()

  return governor
}

const deployTokenLockFixture = async () => {
  const [owner, proposer, voter1] = await ethers.getSigners()

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
