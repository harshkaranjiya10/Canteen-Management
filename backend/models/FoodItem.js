const mongoose = require('mongoose');

const foodItemSchema = new mongoose.Schema({
  name: String,
  description: String,
  price: Number,
  imageUrl: String,
  category: String,
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Reference to the admin who created it
});

module.exports = mongoose.model('FoodItem', foodItemSchema);
