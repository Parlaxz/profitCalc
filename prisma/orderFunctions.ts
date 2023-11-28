import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Function to add an order to the database or update an existing order
export async function addOrder(order) {
  const existingOrder = await prisma.order.findFirst({
    where: {
      orderNumber: order.orderNumber,
    },
  });

  if (existingOrder) {
    return prisma.order.update({
      where: { id: existingOrder.id },
      data: order,
    });
  } else {
    return prisma.order.create({ data: order });
  }
}

// Function to add an array of orders
export async function addOrders(orders) {
  const createdOrders = await prisma.order.createMany({
    data: orders,
  });

  return createdOrders;
}

// Function to get an order by orderNumber
export async function getOrder(orderNumber) {
  return prisma.order.findUnique({
    where: { orderNumber },
  });
}

// Function to get a list of orders with optional filtering
export async function getOrders({ startDate, endDate, limit = 25 }) {
  const where = {};

  if (startDate && endDate) {
    where.date = {
      gte: startDate,
      lte: endDate,
    };
  }

  return prisma.order.findMany({
    where,
    take: limit,
  });
}
