const mongoose = require('mongoose');

const accountEventSchema = new mongoose.Schema(
  {
    accountId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Account',
      required: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ['account_opened', 'balance_update', 'account_closed'],
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    balance: {
      type: Number,
      min: 0,
    },
  },
  { timestamps: false }
);

module.exports = mongoose.model('AccountEvent', accountEventSchema);
