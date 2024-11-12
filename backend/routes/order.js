// backend/routes/orderRoutes.js

router.post("/placeOrder", async (req, res) => {
    const { userId, foodItemId, adminId, quantity, totalPrice } = req.body;
    console.log("Received order details:", req.body); // Debugging line
  
    try {
      const newOrder = new Order({
        userId,
        foodItemId,
        adminId,
        quantity,
        totalPrice,
        status: 'Pending',
      });
      await newOrder.save();
      console.log("Order saved:", newOrder); // Debugging line
      res.status(201).json({ message: "Order placed successfully", order: newOrder });
    } catch (error) {
      console.error("Error placing order:", error);
      res.status(500).json({ error: "Error placing order" });
    }
  });
  