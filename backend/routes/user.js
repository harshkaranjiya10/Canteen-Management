const express = require('express');
const FoodItem = require('../models/FoodItem');
const Order = require('../models/Order');
const authMiddleware = require('../middleware/authMiddleware');
const router = express.Router();

// Route to get food items (Admin: only their own, User: all)
router.get('/items', authMiddleware(['user', 'admin']), async (req, res) => {
  try {
    let foodItems;
    if (req.user.role === 'admin') {
      foodItems = await FoodItem.find({ createdBy: req.user.id });
    } else {
      foodItems = await FoodItem.find();
    }
    res.json(foodItems);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching food items.' });
  }
});

// Route to place an order (User only)
router.post('/placeOrder', authMiddleware(['user']), async (req, res) => {
  const { foodItemId, quantity } = req.body;
  const userId = req.user._id;

  try {
    const foodItem = await FoodItem.findById(foodItemId);
    if (!foodItem) return res.status(404).json({ error: 'Food item not found' });

    const newOrder = new Order({
      userId,
      foodItemId,
      adminId: foodItem.createdBy,
      quantity,
      totalPrice: foodItem.price * quantity,
      status: 'Pending',
    });

    await newOrder.save();
    res.status(201).json({ message: 'Order placed successfully', order: newOrder });
  } catch (error) {
    res.status(500).json({ error: 'Error placing order' });
  }
});

// Route to get a user's order history
router.get('/order-history', authMiddleware(['user']), async (req, res) => {
  try {
    const orders = await Order.find({ userId: req.user._id })
      .populate('foodItemId', 'name')
      .populate('adminId', 'username');
    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching order history' });
  }
});

// Route to get purchased items for the user
router.get('/purchasedItems', authMiddleware(['user']), async (req, res) => {
  try {
    const orders = await Order.find({ userId: req.user._id })
      .populate('foodItemId', 'name description price')
      .populate('adminId', 'username');
    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching purchased items' });
  }
});

// routes/userRoutes.js
router.post('/rateOrder/:orderId', authMiddleware(['user']), async (req, res) => {
  const { orderId } = req.params;
  const { rating } = req.body;

  if (!rating || rating < 1 || rating > 5) {
    return res.status(400).json({ error: 'Rating must be between 1 and 5' });
  }

  try {
    const order = await Order.findOne({ _id: orderId, userId: req.user._id, status: 'Completed' });
    
    if (!order) {
      return res.status(404).json({ error: 'Order not found or not eligible for rating' });
    }

    // Update the order with the user's rating
    order.rating = rating;
    await order.save();

    res.status(200).json({ message: 'Feedback submitted successfully', order });
  } catch (error) {
    res.status(500).json({ error: 'Error submitting feedback' });
  }
});


module.exports = router;
