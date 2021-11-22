App = {
  web3Provider: null,
  contracts: {},
  account: '0x0',
  loading: false,
  tokenPrice: 1000000000000000,
  tokensSold: 0,
  tokensAvailable: 750000,

  init: () => {
    console.log("App Initialized ... ");
    return App.initWeb3();
  },

  initWeb3: () => {
    if (typeof web3 !== 'undefined') {
      App.web3Provider = web3.currentProvider;
      web3 = new Web3(web3.currentProvider);
    } else {
      App.web3Provider = new Web3.providers.HttpProvider('http://localhost:7545');
      web3 = new Web3(App.web3Provider);
    }
    
    return App.initContracts();
  },

  initContracts: () => {
    $.getJSON("SevenCoinSale.json", sevcTokenSale => {
      App.contracts.SevenCoinSale = TruffleContract(sevcTokenSale);
      App.contracts.SevenCoinSale.setProvider(App.web3Provider);
      App.contracts.SevenCoinSale.deployed().then(sevcTokenSale => {
        console.log("SEVC Token Sale address: ", sevcTokenSale.address);
      })
    }).done(() => {
      $.getJSON("SevenCoin.json", sevcToken => {
        App.contracts.SevenCoin = TruffleContract(sevcToken);
        App.contracts.SevenCoin.setProvider(App.web3Provider);
        App.contracts.SevenCoin.deployed().then(sevcToken => {
          console.log("SEVC Token address: ", sevcToken.address);
        });
        App.listenForEvents();
        return App.render();
      });
    });
  },

  listenForEvents: () => {
    App.contracts.SevenCoinSale.deployed().then((instance) => {
      instance.Sell({}, {
        fromBlock: 0,
        toBlock: 'latest'
      }).watch((err, event) => {
        console.log("Event Trigerred", event);
        App.render();
      })
    })
  },

  render: () => {
    if (App.loading) {
      return;
    }
    App.loading = true;

    let loader = $('#loader');
    let content = $('#content');

    loader.show();
    content.hide();

    // Load account data
    web3.eth.getCoinbase((err, account) => {
      if (err === null) {
        console.log("account: ", account);
        App.account = account;
        $('#accountAddress').html("Your account: " + account);
      }
    });

    // Load token sale contract
    App.contracts.SevenCoinSale.deployed().then((instance) => {
      sevcTokenSaleInstance = instance;
      return sevcTokenSaleInstance.tokenPrice();
    }).then(tokenPrice => {
      App.tokenPrice = tokenPrice;
      $('.token-price').html(web3.fromWei(App.tokenPrice, "ether").toNumber());
      return sevcTokenSaleInstance.tokensSold();
    }).then(tokensSold => {
      App.tokensSold = tokensSold.toNumber();
      $('.token-sold').html(App.tokensSold);
      $('.tokens-available').html(App.tokensAvailable);

      let progressPercent = (App.tokensSold / App.tokensAvailable) * 100;
      $('#progress').css('width', progressPercent + '%');

      // Load token contract
      App.contracts.SevenCoin.deployed().then(instance => {
        sevcTokenInstance = instance;
        return sevcTokenInstance.balanceOf(App.account);
      }).then(balance => {
        $('.sevc-balance').html(balance.toNumber());
        
        App.loading = false;
        loader.hide();
        content.show()
      })
    });
  },

  buyTokens: () => {
    $('#content').hide();
    $('#loader').show();

    let numberOfTokens = $('#numberOfTokens').val();
    App.contracts.SevenCoinSale.deployed().then(instance => {
      return instance.buyTokens(numberOfTokens, {
        from: App.account,
        value: numberOfTokens * App.tokenPrice,
        gas: 500000
      });
    }).then(result => {
      console.log("Tokens bought ...");
      $('form').trigger('reset');
      // Wait for sell event
    })
  }
}

$(function() {
  $(window).load(function() {
    App.init();
  })
});