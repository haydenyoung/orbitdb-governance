import * as Ipfs from 'ipfs-core'
import { createOrbitDB } from '@orbitdb/core'
import { deployProposerIdentity, deployVoterIdentity } from './identities.js'

const createProposerOrbitDB = async () => {
  const config = {
    Addresses: {
      API: '/ip4/127.0.0.1/tcp/0',
      Swarm: ['/ip4/0.0.0.0/tcp/0'],
      Gateway: '/ip4/0.0.0.0/tcp/0'
    },
    Bootstrap: [],
    Discovery: {
      MDNS: {
        Enabled: true,
        Interval: 0
      },
      webRTCStar: {
        Enabled: false
      }
    }
  }

  const id = 'proposer'
  const repo = './ipfs/proposer'
  const directory = './orbitdb/proposer'

  const ipfs = await Ipfs.create({ repo, config })

  const [ identities, identity ] = await deployProposerIdentity()

  const orbitdb = await createOrbitDB({ ipfs, id, directory, identities, identity })

  return orbitdb
}

const createVoterOrbitDB = async () => {
  const config = {
    Addresses: {
      API: '/ip4/127.0.0.1/tcp/0',
      Swarm: ['/ip4/0.0.0.0/tcp/0'],
      Gateway: '/ip4/0.0.0.0/tcp/0'
    },
    Bootstrap: [],
    Discovery: {
      MDNS: {
        Enabled: true,
        Interval: 0
      },
      webRTCStar: {
        Enabled: false
      }
    }
  }

  const id = 'voter'
  const repo = './ipfs/voter'
  const directory = './orbitdb/voter'

  const ipfs = await Ipfs.create({ repo, config })

  const [ identities, identity ] = await deployVoterIdentity()

  const orbitdb = await createOrbitDB({ ipfs, id, directory, identities, identity })

  return orbitdb
}

export {
  createProposerOrbitDB,
  createVoterOrbitDB
}
