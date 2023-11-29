import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Getter function for a single order by orderNumber
export const getShopifyOrderByOrderNumber = async (orderNumber) => {
  return prisma.shopifyOrder.findUnique({
    where: { orderNumber: orderNumber },
  });
};

// Getter function for an array of orders by orderNumbers
export const getShopifyOrdersByOrderNumbers = async (orderNumbers) => {
  return prisma.shopifyOrder.findMany({
    where: { orderNumber: { in: orderNumbers } },
  });
};

// Setter function for a single order with check for existing orderNumber
export const setShopifyOrder = async (orderData) => {
  const existingOrder = await prisma.shopifyOrder.findUnique({
    where: { orderNumber: orderData.orderNumber },
  });

  if (!existingOrder) {
    return prisma.shopifyOrder.create({
      data: orderData,
    });
  } else {
    console.log(
      `Order with orderNumber ${orderData.orderNumber} already exists.`
    );
    return null; // or handle it as per your requirement
  }
};

// Setter function for an array of orders with check for existing orderNumbers
export const setShopifyOrders = async (ordersData) => {
  const existingOrders = await prisma.shopifyOrder.findMany({
    where: {
      orderNumber: {
        in: ordersData.map((order) => {
          console.log("order", order);
          return order.orderNumber;
        }),
      },
    },
  });
  console.log(existingOrders);
  const newOrdersData = ordersData.filter(
    (order) =>
      !existingOrders.some(
        (existingOrder) => existingOrder.orderNumber === order.orderNumber
      )
  );

  if (newOrdersData.length > 0) {
    return prisma.shopifyOrder.createMany({
      data: newOrdersData,
    });
  } else {
    console.log("All provided orderNumbers already exist in the database.");
    return null; // or handle it as per your requirement
  }
};
