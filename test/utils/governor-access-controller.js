import pathJoin from './path-join.js'

const type = 'governor'

const GovernorAccessController = (contractAddress) => async ({ orbitdb, identities, address, name }) => {
  if (contractAddress) {
    address = contractAddress
    address = pathJoin('/', type, address)
  }

  const canAppend = async (entry) => {
    const writerIdentity = await identities.getIdentity(entry.identity)
    if (!writerIdentity) {
      return false
    }

    const { id } = writerIdentity

    const governor = await ethers.getContractAt('Governor', address.split('/').pop())
    const tokenLock = await ethers.getContractAt('TokenLock', await governor.lock())

    const hasWriteAccess = await tokenLock.canVote(id, entry.payload.value.tokens) || await governor.owner() === id

    if (hasWriteAccess) {
      return identities.verifyIdentity(writerIdentity)
    }

    return false
  }

  return {
    type,
    address,
    canAppend
  }
}

GovernorAccessController.type = type

export default GovernorAccessController
