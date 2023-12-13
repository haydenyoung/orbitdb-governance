import { createHelia } from 'helia'
import { createLibp2p } from 'libp2p'
import { tcp } from '@libp2p/tcp'
import { webSockets } from '@libp2p/websockets'
import { yamux } from '@chainsafe/libp2p-yamux'
import { identifyService } from 'libp2p/identify'
import { gossipsub } from '@chainsafe/libp2p-gossipsub'
import { noise } from '@chainsafe/libp2p-noise'
import { MemoryDatastore } from 'datastore-core'
import { createOrbitDB, useIdentityProvider } from '@orbitdb/core'
import OrbitDBIdentityProviderEthereum from '@orbitdb/identity-provider-ethereum'

export default async (id, wallet) => {
  const repo = './ipfs/'+id
  const directory = './orbitdb/'+id

  const options = {
    datastore: new MemoryDatastore(),
    addresses: {
      listen: [
        '/ip4/127.0.0.1/tcp/0',
        '/ip4/0.0.0.0/tcp/0/ws'
      ]
    },
    transports: [
      tcp(),
      webSockets()
    ],
    connectionEncryption: [
      noise()
    ],
    streamMuxers: [
      yamux()
    ],
    services: {
      identify: identifyService(),
      pubsub: gossipsub({ allowPublishToZeroPeers: true })
    }
  }

  const libp2p = await createLibp2p(options)
  const ipfs = await createHelia({ repo, libp2p })

  useIdentityProvider(OrbitDBIdentityProviderEthereum)

  const provider = OrbitDBIdentityProviderEthereum({ wallet })

  const orbitdb = await createOrbitDB({ ipfs, id, directory, identity: { provider } })

  return orbitdb
}
