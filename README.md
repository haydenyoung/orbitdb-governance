# OrbitDB Governance

This project explores off-chain voting using OrbitDB as a local-first database for storing votes cast. Once voting has completed, the results can be ratified on-chain by hashing the database and storing the hash in a smart contract. Other peers can then verify the results using a local replica of the votes, matching the hash they produce to the official results.

The benefit of this method over other off-chain mechanisms is that results can be verified by everyone who participates in the voting process (and even those who are simply witnesses to the vote). In the case of on-chain voting, off-chain governance drastically reduces the financial cost of the voting process because only the proposal and results are published to the blockchain.

A peer-to-peer  database solution provides both cost-effectiveness and veracity because it does not require every vote be registered on the blockchain but because of its decentralized nature, every participant can act as a verifier of the results, providing a type of trustless verification.

This project is a proof of concept and an exploration of OrbitDB as a replacement for traditional, centralized database-driven off-chain governance. The project is currently missing many security features integral to production usage. Therefore, it is not advised that this project be used for actual governance systems.

Any feedback is welcome. This is an open source project offered as a base to ongoing discussion about the use of OrbitDB in off-chain governance and potentially other, off-chain solutions such as micro-transactions.

## Installation

Download from Github:

```
git clone https://github.com/haydenyoung/metacoin.git
```

Install dependencies:

```
npm i
```

## Running the tests

To run the tests:

```
npx hardhat test
```
