import pathJoin from './path-join.js'

const type = 'governor'

const GovernorAccessController = ({ governorAddress, proposalId } = {}) => async ({ orbitdb, identities, address, name }) => {
  if (governorAddress && proposalId) {
    address = pathJoin('/', type, governorAddress, proposalId)
  } else {
    const parts = address.split('/')
    proposalId = parts.pop()
    governorAddress = parts.pop()
  }

  if (!governorAddress) {
    throw new Exception('No governor contract specified')
  }

  if (!proposalId) {
    throw new Exception("no proposalId specified")
  }

  const canAppend = async (entry) => {
    const writerIdentity = await identities.getIdentity(entry.identity)
    if (!writerIdentity) {
      return false
    }

    const { id } = writerIdentity

    const governor = await ethers.getContractAt('Governor', governorAddress)

    const hasWriteAccess = await governor.canVote(proposalId, id, entry.payload.value.tokens) || await governor.owner() === id

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
