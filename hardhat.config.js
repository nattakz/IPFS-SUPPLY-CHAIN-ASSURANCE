require("@nomicfoundation/hardhat-toolbox");

/** @type import('hardhat/config').HardhatUserConfig */

// This is a sample Hardhat task. To learn how to create your own go to
// https://hardhat.org/guides/create-task.html
task("accounts", "Prints the list of accounts", async () => {
  const accounts = await ethers.getSigners();
  for (const account of accounts) {
    console.log(account.address);
  }
});

task("balance", "Prints an account's balance")
.addParam("account", "The account's address")
.setAction(async taskArgs => {
  const account = web3.utils.toChecksumAddress(taskArgs.account);
  const balance = await web3.eth.getBalance(account);

  console.log(web3.utils.fromWei(balance, "ether"), "ETH");
});

// You need to export an object to set up your config
// Go to https://hardhat.org/config/ to learn more

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
  defaultNetwork: "hardhat",
  paths: {
    artifacts: './src/artifacts',
  },
  networks: {
    hardhat: {
      chainId: 1337,
    },
    // ropsten: {
    //   url: "https://ropsten.infura.io/v3/projectid",
    //   accounts: [process.env.a2key]
    // },
    // rinkeby: {
    //   url: "https://rinkeby.infura.io/v3/projectid",
    //   accounts: [process.env.a2key]
    // }
  },
  solidity: "0.8.9",
};







// This is an original version
/* module.exports = {
  solidity: "0.8.9",
  paths: {
    artifacts: './src/artifacts',
  },
  networks: {
    hardhat: {
      chainId: 1337,
      allowUnlimitedContractSize: true
    }
  }
}; */
