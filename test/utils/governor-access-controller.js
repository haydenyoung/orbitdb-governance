import { deployTokenLockFixture } from './fixtures/contracts.js'
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

    const tokenLock = await deployTokenLockFixture()

    const hasWriteAccess = await tokenLock.canVote(id) || orbitdb.identity.id == id

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
