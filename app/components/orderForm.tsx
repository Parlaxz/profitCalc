import React, { useState } from "react";
import { addOrder } from "prisma/orderFunctions";

function OrderForm() {
  const [order, setOrder] = useState({
    orderNumber: "",
    date: new Date(),
    printifyQuantity: 0,
    shopifyQuantity: 0,
    totalCost: 0.0,
    totalRevenue: 0.0,
    shopifyCut: 0.0,
    totalProfit: 0.0,
  });

  const [successMessage, setSuccessMessage] = useState(null);

  const handleAddOrder = async () => {
    try {
      // Call the addOrder function with the order data
      const addedOrder = await addOrder(order);

      // Display a success message
      setSuccessMessage(`Order added successfully with ID: ${addedOrder.id}`);
    } catch (error) {
      console.error("Error adding order:", error);
      setSuccessMessage("Error adding order. Please try again.");
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setOrder({ ...order, [name]: value });
  };

  return (
    <div>
      <h1>Order Form</h1>
      <input
        type="text"
        name="orderNumber"
        placeholder="Order Number"
        value={order.orderNumber}
        onChange={handleChange}
      />
      {/* Add input fields for other order properties here */}

      <button onClick={handleAddOrder}>Add Order</button>
      {successMessage && <div>{successMessage}</div>}
    </div>
  );
}

export default OrderForm;
