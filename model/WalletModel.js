const mongoose = require('mongoose');

const WalletSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    walletTotalBalance: { type: Number, default: 0 },
    walletAmount: { type: Number, default: 0 },
    winningsAmount: { type: Number, default: 0 },
    transactions: [
        {
            amount: Number,
            message: String,
            date: { type: Date, default: Date.now }
        }
    ]
});

module.exports = mongoose.model('Wallet', WalletSchema);
