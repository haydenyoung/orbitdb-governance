const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");

module.exports = buildModule("OrbitDBVoting", (m) => {
  const governor = m.contract("Governor")

  return { governor };
});
