import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Function to add a Printify order to the database or update an existing one
export async function addPrintifyOrder(printifyOrder) {
  const existingPrintifyOrder = await prisma.printifyOrder.findFirst({
    where: {
      orderNumber: printifyOrder.orderNumber,
    },
  });

  if (existingPrintifyOrder) {
    return prisma.printifyOrder.update({
      where: { orderNumber: existingPrintifyOrder.orderNumber },
      data: printifyOrder,
    });
  } else {
    return prisma.printifyOrder.create({ data: printifyOrder });
  }
}

// Function to add an array of Printify orders
export async function addPrintifyOrders(printifyOrders) {
  const updatedPrintifyOrders = [];

  for (const order of printifyOrders) {
    const existingOrder = await prisma.printifyOrder.findFirst({
      where: {
        orderNumber: order.orderNumber,
      },
    });
    console.log("existingOrder", existingOrder);
    if (existingOrder) {
      // Order already exists, update it
      const updatedOrder = await prisma.printifyOrder.update({
        where: { orderNumber: existingOrder.orderNumber },
        data: order,
      });
      updatedPrintifyOrders.push(updatedOrder);
    } else {
      // Order doesn't exist, create a new one
      const createdOrder = await prisma.printifyOrder.create({
        data: order,
      });
      updatedPrintifyOrders.push(createdOrder);
    }
  }

  return updatedPrintifyOrders;
}

// Function to get a Printify order by orderNumber
export async function getPrintifyOrder(orderNumber) {
  return prisma.printifyOrder.findUnique({
    where: { orderNumber },
  });
}

// Function to get a list of Printify orders with optional filtering
export async function getPrintifyOrders({ startDate, endDate, limit = 25 }) {
  const where = {};

  if (startDate && endDate) {
    where.date = {
      gte: startDate,
      lte: endDate,
    };
  }

  return prisma.printifyOrder.findMany({
    where,
    take: limit,
  });
}
