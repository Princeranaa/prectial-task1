const mongoose = require('mongoose');

const walletSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true
    },
    walletTotalBalance: {
        type: Number,
        default: 0
    },
    walletAmount: {
        type: Number,
        default: 0
    },
    winningsAmount: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true // Automatically add createdAt and updatedAt fields
});

module.exports = mongoose.model('Wallet', walletSchema);
