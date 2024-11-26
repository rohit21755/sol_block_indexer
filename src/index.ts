const { Connection, clusterApiUrl } = require("@solana/web3.js");
const mongoose = require('mongoose');

mongoose.connect('mongodb://localhost:27017/solana', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
const connection = new Connection(clusterApiUrl("devnet"));

const TransactionSchema = new mongoose.Schema({
  signature: { type: String, required: true }, 
});
const BlockSchema = new mongoose.Schema({
  blockhash: { type: String, required: true },
  numTransactions: { type: Number, required: true },
  transactions: [TransactionSchema], 
});

const Block = mongoose.model('Block', BlockSchema); 

async function main() {
  try {
    console.log("Fetching block info...");
    const recentSlot = await connection.getSlot();
    const block = await connection.getBlock(recentSlot, {
      commitment: 'confirmed',
      maxSupportedTransactionVersion: 0,
    });

    if (!block) {
      console.log(`Block ${recentSlot} not found.`);
      return;
    }

    console.log(`Block ${recentSlot} hash: ${block.blockhash}`);
    console.log(`Block transactions: ${block.transactions.length}`);
    console.log(block.transactions[0].transaction.signatures[0]);

    const { blockhash, transactions } = block;
    const transactionData = transactions.map((tx: any) => ({
      signature: tx.transaction.signatures[0],
    }));
    const blockData = {
      blockhash,
      numTransactions: block.transactions.length,
      transactions: transactionData,
    };
    await Block.updateOne({ blockhash }, { $set: blockData }, { upsert: true });

    console.log(`Block ${blockhash} and its transactions have been saved.`);
  } catch (err) {
    console.log("Error fetching or saving block data:", err);
  }
}

main();
