const express = require('express');
const FoodItem = require('../models/FoodItem');
const Order = require('../models/Order');
const authMiddleware = require('../middleware/authMiddleware');
const router = express.Router();

// Route to upload a new food item (Admin only)
router.post('/upload', authMiddleware(['admin']), async (req, res) => {
  const { name, description, price, imageUrl, category } = req.body;
  try {
    const newFoodItem = new FoodItem({
      name,
      description,
      price,
      imageUrl,
      category,
      createdBy: req.user.id, // Set the admin's ID
    });
    await newFoodItem.save();
    res.status(201).json({ message: 'Food item uploaded successfully!' });
  } catch (error) {
    res.status(500).json({ error: 'Error uploading food item.' });
  }
});

// Route to delete food item (Admin only)
router.delete('/delete/:id', authMiddleware(['admin']), async (req, res) => {
  const foodItemId = req.params.id;
  try {
    const foodItem = await FoodItem.findOne({ _id: foodItemId, createdBy: req.user.id });
    if (!foodItem) return res.status(403).json({ error: 'Not authorized to delete this item' });
    await FoodItem.findByIdAndDelete(foodItemId);
    res.json({ message: 'Food item deleted successfully!' });
  } catch (error) {
    res.status(500).json({ error: 'Error deleting food item' });
  }
});

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

// Route to get orders for the admin's food items
router.get('/orders', authMiddleware(['admin']), async (req, res) => {
  try {
    const orders = await Order.find({ adminId: req.user.id }).populate('foodItemId userId');
    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching orders' });
  }
});

// Route to mark an order as completed (Admin only)
router.put('/complete-order/:orderId', authMiddleware(['admin']), async (req, res) => {
  try {
    const order = await Order.findOneAndUpdate(
      { _id: req.params.orderId, adminId: req.user._id },
      { status: 'Completed' },
      { new: true }
    );
    if (!order) return res.status(403).json({ error: 'Order not found or not authorized' });

    // Optional: Notify the user (simplified logging here)
    console.log(`Order for ${order.foodItemId.name} completed. Notifying user ${order.userId.username}.`);
    res.json({ message: 'Order completed successfully!' });
  } catch (error) {
    res.status(500).json({ error: 'Error completing order' });
  }
});

// Delete food item route (Admin only)
router.delete('/delete/:id', authMiddleware(['admin']), async (req, res) => {
  const foodItemId = req.params.id;
  const adminId = req.user._id;

  try {
    // Find the food item and ensure it was created by the requesting admin
    const foodItem = await FoodItem.findOne({ _id: foodItemId, createdBy: adminId });
    
    if (!foodItem) {
      return res.status(403).json({ error: 'You are not authorized to delete this item' });
    }

    // Delete all orders associated with the food item
    await Order.deleteMany({ foodItemId });

    // Delete the food item
    await FoodItem.findByIdAndDelete(foodItemId);
    
    res.json({ message: 'Food item and associated orders deleted successfully!' });
  } catch (error) {
    res.status(500).json({ error: 'Error deleting food item and associated orders' });
  }
});

// Route to send notification to user when order is completed
router.post('/sendNotification', authMiddleware(['admin']), async (req, res) => {
  const { userId, message } = req.body;

  try {
    // Here you could implement the logic to send an actual notification (email, push, etc.)
    // For now, we simulate the notification by updating the user record or sending a simple message
    // You can add logic to store these notifications in a database or send an email

    // Example: You could store the notification in a "UserNotifications" model
    console.log(`Notification to user: ${userId} - ${message}`);
    res.status(200).json({ message: 'Notification sent successfully!' });
  } catch (error) {
    console.error("Error sending notification:", error);
    res.status(500).json({ error: 'Error sending notification' });
  }
});


module.exports = router;
