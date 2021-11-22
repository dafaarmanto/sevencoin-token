const SevenCoin = artifacts.require("SevenCoin");
const SevenCoinSale = artifacts.require("SevenCoinSale");

contract("SevenCoinSale", (accounts) => {
  let tokenInstance;
  let tokenSaleInstance;
  let admin = accounts[0];
  let buyer = accounts[1];
  let tokenPrice = 1000000000000000; // wei
  let tokensAvailable = 750000;
  let numberOfTokens;

  it('initializes the contract with the correct values', () => {
    return SevenCoinSale.deployed().then((instance) => {
      tokenSaleInstance = instance;
      return tokenSaleInstance.address
    }).then((address) => {
      assert.notEqual(address, 0x0, 'has contract address');
      return tokenSaleInstance.tokenContract();
    }).then(address => {
      assert.notEqual(address, 0x0, 'has token contract address');
      return tokenSaleInstance.tokenPrice();
    }).then(price => {
      assert.equal(price, tokenPrice, 'token price is correct')
    })
  })

  it('facilitates token buying', () => {
    return SevenCoin.deployed().then(instance => {
      tokenInstance = instance;
      return SevenCoinSale.deployed();
    }).then(instance => {
      tokenSaleInstance = instance;
      return tokenInstance.transfer(tokenSaleInstance.address, tokensAvailable, {from: admin});
    }).then(receipt => {
      numberOfTokens = 10;
      return tokenSaleInstance.buyTokens(numberOfTokens, {from: buyer, value: numberOfTokens * tokenPrice});
    }).then(receipt => {
      assert.equal(receipt.logs.length, 1, 'triggers one event');
      assert.equal(receipt.logs[0].event, 'Sell', 'should be the "Sell" event');
      assert.equal(receipt.logs[0].args._buyer, buyer, 'logs the account that purchased the tokens');
      assert.equal(receipt.logs[0].args._amount, numberOfTokens, 'logs the number of tokens purchased');
      return tokenSaleInstance.tokensSold();
    }).then(amount => {
      assert.equal(amount.toNumber(), numberOfTokens, 'increments the number of tokens sold');
      return tokenInstance.balanceOf(buyer);
    }).then(balance => {
      assert.equal(balance.toNumber(), numberOfTokens);
      return tokenInstance.balanceOf(tokenSaleInstance.address);
    }).then(balance => {
      assert.equal(balance.toNumber(), tokensAvailable - numberOfTokens);
      return tokenSaleInstance.buyTokens(numberOfTokens, {from: buyer, value: 1});
    }).then(assert.fail).catch(e => {
      assert(e.message, 'message value must equal of number of tokens in wei');
      return tokenSaleInstance.buyTokens(800000, {from: buyer, value: numberOfTokens * tokenPrice});
    }).then(assert.fail).catch(e => {
      assert(e.message, 'message value must equal of number of tokens in wei');
    })
  });

  it('ends token sale', () => {
    return SevenCoin.deployed().then(instance => {
      tokenInstance = instance;
      return SevenCoinSale.deployed();
    }).then(instance => {
      tokenSaleInstance = instance;
      return tokenSaleInstance.endSale({from: buyer});
    }).then(assert.fail).catch(e => {
      assert(e.message, 'must be admin to end sale');
      // End sale as admin
      return tokenSaleInstance.endSale({from: admin});
    }).then(receipt => {
      return tokenInstance.balanceOf(admin);
    }).then(balance => {
      assert.equal(balance, 999990, 'returns all unsold SEVC Coins to admin');
      return tokenInstance.balanceOf(tokenSaleInstance.address);
    }).then(balance => {
      assert.equal(balance.toNumber(), 0, 'token price was reset')
    })
  })
});