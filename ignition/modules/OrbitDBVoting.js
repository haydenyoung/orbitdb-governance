import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("OrbitDBVoting", (m) => {
  const governor = m.contract("Governor")
  const tokenLock = m.contract("TokenLock")

  return { governor, tokenLock };
});
