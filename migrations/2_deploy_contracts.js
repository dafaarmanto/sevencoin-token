const SevenCoin = artifacts.require("SevenCoin");
const SevenCoinSale = artifacts.require("SevenCoinSale");

module.exports = function (deployer) {
  deployer.deploy(SevenCoin, 1000000).then(() => {
    let tokenPrice = 1000000000000000; // 0.001 ether
    return deployer.deploy(SevenCoinSale, SevenCoin.address, tokenPrice);
  });
};