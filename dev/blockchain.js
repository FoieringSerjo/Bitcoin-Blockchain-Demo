const sha256 = require('sha256');
const { v4: uuidv4 } = require('uuid');
const currentNodeUrl = process.argv[3];

// class Blockchain {
//   constructor() {
//     this.chain = [];
//     this.pendingTransactions = [];
//   }

//   //methods
// }

function Blockchain() {
  this.chain = [];
  this.pendingTransactions = [];

  this.currentNodeUrl = currentNodeUrl;
  this.networkNodes = [];

  this.createNewBlock(100, '0', '0');
}

Blockchain.prototype.createNewBlock = function (nonce, previousBlockHash, hash) {
  const newBlock = {
    index: this.chain.length + 1,
    timestamp: Date.now(),
    transactions: this.pendingTransactions,
    nonce,
    hash,
    previousBlockHash,
  };
  this.pendingTransactions = [];
  this.chain.push(newBlock);

  return newBlock;
};

Blockchain.prototype.getLastBlock = function () {
  return this.chain[this.chain.length - 1];
};

Blockchain.prototype.createNewTransaction = function (amount, sender, recipient) {
  const newTransaction = {
    amount,
    sender,
    recipient,
    transactionId: uuidv4().split('-').join(''),
  };

  return newTransaction;
};

Blockchain.prototype.addTransactionToPendingTransactions = function (transactionObj) {
  this.pendingTransactions.push(transactionObj);
  return this.getLastBlock()['index'] + 1;
};

/**
 *
 * @param {string} previousBlackHash
 * @param {Array} currentBlockData - Array of objects
 * @param {number} nonce
 * @returns {string} Hash of all data inserted above
 */
Blockchain.prototype.hashBlock = function (previousBlackHash, currentBlockData, nonce) {
  const dataAsString = previousBlackHash + nonce.toString() + JSON.stringify(currentBlockData);
  const hash = sha256(dataAsString);
  return hash;
};

Blockchain.prototype.proofOfWork = function (previousBlackHash, currentBlockData) {
  // => repeatedly hash block until it finds correct hash => '0000IOJNKLNMASD98'
  // => uses current block data for the hash, but also the previousBlackHash
  // => continuously changes nonce value until it finds the correct hash
  // => returns to us the nonce value that creates the correct hash

  let nonce = 0;
  let hash = this.hashBlock(previousBlackHash, currentBlockData, nonce);
  while (hash.substring(0, 4) !== '0000') {
    nonce++;
    hash = this.hashBlock(previousBlackHash, currentBlockData, nonce);
    // console.log(hash);
  }
  return nonce;
};

Blockchain.prototype.chainIsValid = function (blockchain) {
  let validChain = true;

  for (var i = 1; i < blockchain.length; i++) {
    const currentBlock = blockchain[i];
    const prevBlock = blockchain[i - 1];
    const blockHash = this.hashBlock(
      prevBlock['hash'],
      { transactions: currentBlock['transactions'], index: currentBlock['index'] },
      currentBlock['nonce']
    );

    if (blockHash.substring(0, 4) !== '0000') validChain = false;
    if (currentBlock['previousBlockHash'] !== prevBlock['hash']) validChain = false;

    // console.log('previousBlockHash => ', prevBlock['hash']);
    // console.log('currentBlockHash => ', currentBlock['hash']);
  }

  const genesisBlock = blockchain[0];
  const correctNonce = genesisBlock['nonce'] === 100;
  const correctPreviousBlockHash = genesisBlock['previousBlockHash'] === '0';
  const correctHash = genesisBlock['hash'] === '0';
  const correctTransactions = genesisBlock['transactions'].length === 0;

  if (!correctNonce || !correctPreviousBlockHash || !correctHash || !correctTransactions)
    validChain = false;

  return validChain;
};

Blockchain.prototype.getBlock = function (blockHash) {
  let correctBlock = null;
  this.chain.forEach((block) => {
    if (block.hash === blockHash) correctBlock = block;
  });
  return correctBlock;
};

Blockchain.prototype.getTransaction = function (transactionId) {
  let correctTransaction = null;
  let correctBlock = null;

  this.chain.forEach((block) => {
    block.transactions.forEach((transaction) => {
      if (transaction.transactionId === transactionId) {
        correctTransaction = transaction;
        correctBlock = block;
      }
    });
  });

  data = {
    transaction: correctTransaction,
    block: correctBlock,
  };

  return data;
};

Blockchain.prototype.getAddressData = function (address) {
  const addressTransactions = [];
  this.chain.forEach((block) => {
    block.transactions.forEach((transaction) => {
      if (transaction.sender === address || transaction.recipient === address) {
        addressTransactions.push(transaction);
      }
    });
  });

  let balance = 0;
  addressTransactions.forEach((transaction) => {
    if (transaction.recipient === address) {
      balance += transaction.amount;
    } else if (transaction.sender === address) {
      balance -= transaction.amount;
    }
  });

  data = {
    addressTransactions,
    addressBalance: balance,
  };

  return data;
};

module.exports = Blockchain;
