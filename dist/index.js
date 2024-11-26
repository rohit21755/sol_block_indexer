"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
const { Connection, clusterApiUrl } = require("@solana/web3.js");
const mongoose = require('mongoose');
// MongoDB Connection
mongoose.connect('mongodb://localhost:27017/solana', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});
// Solana Connection
const connection = new Connection(clusterApiUrl("devnet"));
// Transaction Subdocument Schema
const TransactionSchema = new mongoose.Schema({
    signature: { type: String, required: true }, // Signature of the transaction
});
// Block Schema
const BlockSchema = new mongoose.Schema({
    blockhash: { type: String, required: true },
    numTransactions: { type: Number, required: true },
    transactions: [TransactionSchema], // Embed the Transaction Schema
});
// Create Mongoose Model for Block
const Block = mongoose.model('Block', BlockSchema); // Create the model from the schema
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            console.log("Fetching block info...");
            const recentSlot = yield connection.getSlot();
            const block = yield connection.getBlock(recentSlot, {
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
            // Map transactions to the TransactionSchema format
            const transactionData = transactions.map((tx) => ({
                signature: tx.transaction.signatures[0],
            }));
            // Prepare Block data to insert
            const blockData = {
                blockhash,
                numTransactions: block.transactions.length,
                transactions: transactionData,
            };
            // Upsert the Block data into MongoDB (update if exists, insert if new)
            yield Block.updateOne({ blockhash }, { $set: blockData }, { upsert: true });
            console.log(`Block ${blockhash} and its transactions have been saved.`);
        }
        catch (err) {
            console.log("Error fetching or saving block data:", err);
        }
    });
}
main();
