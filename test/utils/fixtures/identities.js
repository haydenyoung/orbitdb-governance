import OrbitDBIdentityProviderEthereum from '@orbitdb/identity-provider-ethereum'
import { useIdentityProvider, KeyStore, Identities } from '@orbitdb/core'
import path from 'path'
import { proposer, voter1 } from './contracts.js'

const deployProposerIdentity = async () => {
  const keypath = path.resolve('./orbitdb/proposer/keys')

  useIdentityProvider(OrbitDBIdentityProviderEthereum)

  const keystore = await KeyStore({ path: keypath })
  const identities = await Identities({ keystore })
  const provider = OrbitDBIdentityProviderEthereum({ wallet: proposer })
  return [ identities, await identities.createIdentity({ provider, keystore }) ]
}

const deployVoterIdentity = async () => {
  const keypath = path.resolve('./orbitdb/voter/keys')

  useIdentityProvider(OrbitDBIdentityProviderEthereum)

  const keystore = await KeyStore({ path: keypath })
  const identities = await Identities({ keystore })
  const provider = OrbitDBIdentityProviderEthereum({ wallet: voter1 })
  return [ identities, await identities.createIdentity({ provider, keystore }) ]
}

export {
  deployProposerIdentity,
  deployVoterIdentity
}
