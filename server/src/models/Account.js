const mongoose = require('mongoose');

const accountSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, required: true, trim: true },
    category: { type: String, required: true, enum: ['asset', 'debt'] },
    type: {
      type: String,
      required: true,
      enum: ['investment', 'property', 'vehicle', 'cash', 'loan', 'credit_card'],
    },
    balance: { type: Number, required: true, min: 0 },
    // Shared optional fields
    interestRate: { type: Number },
    // Asset fields
    expectedGrowthRate: { type: Number },
    monthlyContribution: { type: Number },
    // Debt fields
    monthlyPayment: { type: Number },
    remainingTerm: { type: Number },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Account', accountSchema);
