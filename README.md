# OrbitDB Governance

This project explores off-chain voting using OrbitDB as a local-first database for storing votes cast. Once voting has completed, the results can be ratified on-chain by hashing the database and storing the hash in a smart contract. Other peers can then verify the results using a local replica of the votes, matching the hash they produce to the official results.

The benefit of this method over other off-chain mechanisms is that results can be verified by everyone who participates in the voting process (and even extend to those in an auditing role). Off-chain governance drastically reduces the financial cost of the voting process because only the proposal and results are published to the blockchain.

A peer-to-peer  database solution provides both cost-effectiveness and veracity because it does not require every vote be registered on the blockchain but because of its decentralized nature, every participant can act as a verifier of the results, providing a type of trustless verification.

This project is a proof of concept and an exploration of OrbitDB as a replacement for traditional, centralized database-driven off-chain governance. 

This governance project is currently missing many security features integral to production usage. Therefore, it is not advised that this project be used for actual governance systems.

Any feedback is welcome. This is an open source project offered as a base to ongoing discussion about the use of OrbitDB in off-chain governance and potentially other, off-chain solutions such as micro-transactions.

## How it works

A person or an organization wants to propose ideas, concepts and updates to their community and allow their members to decide on which proposals are implemented. Community members are issued tokens which provide them with voting "weight". This concept is known as tokenized governance and incentivizes the community to participate in the voting process as they have a direct influence on decision-making.  

The proposer "puts up" a proposal which will introduce a new governing rule, change an existing one or annul an obsolete one. Details about the proposal are provided and the proposal is officially "put forward" using a Governance smart contract. The proposer also provides a starting time and duration for the proposal's voting period. The proposal's details are captured to a local database which can be replicated by other community members. The proposal also includes options which can be selected by the voter. These options could consist of a simple "Yes"/"No" or could be more numerous or be more descriptive.

Before voting, community members must stake tokens to indicate their intention to participate. A voter can not vote if they have not staked tokens for a duration that exceeds the duration of the proposal's voting period.

Community members will be able to review the proposal's details and submit a vote based on the proposal's available options. Votes are stored off-chain in the community member's copy of the votes database. If the vote is valid, it will be replicated across other databases held by the proposer and other voters. Voters will only be able to vote up to the number of tokens (voting weight) they have staked. Voters cannot change their voting weight once a vote has been cast.

Once the voting period has expired, voters will no longer be able to cast a vote.

Once the voting period has ended, the proposer must hash the voting results using their copy of the votes database. The vote count will take place off-chain and the resulting vote count will be published to the contract.

An election audit can be carried out by anyone who has staked tokens prior to, during and after the completion of the proposal's vote count. This election audit will execute the same off-chain vote count as used by the proposer. If there is a discrepancy, the auditor can contest the validity of the vote during the dispute period. If a threshold set prior to the voting period is reached, the proposal is voided and the proposal must either be discarded or resubmitted for a new vote.

**The process outlined above describes a simple governance process as a starting point. Good governance is a complex and nuanced process which requires a great deal of thought and consideration. Rather, the idea is to provide an example of off-chain peer-to-peer voting which can be extended and customized for real world implementation.**

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
