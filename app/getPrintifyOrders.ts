import { PrintifyOrder } from "@prisma/client";
import { prisma } from "./apiHelpers";

export async function getPrintifyOrders(
  firstOrderNum: number,
  lastOrderNum: number,
  refresh: boolean = false
) {
  const printifyEndpoint =
    "https://api.printify.com/v1/shops/2666622/orders.json";
  const printifyAccessToken = process.env.PRINTIFY_API_TOKEN;

  const printifyHeaders = {
    Authorization: `Bearer ${printifyAccessToken}`,
  };

  // Step 1: Find existing orders in the database
  let existingOrders = [];
  if (!refresh) {
    existingOrders = await prisma.printifyOrder.findMany({
      where: {
        orderNumber: {
          gte: firstOrderNum,
          lte: lastOrderNum,
        },
      },
    });
  }

  // Step 2: Find missing orders from Printify
  let missingOrders = [];
  for (let i = firstOrderNum; i <= lastOrderNum; i++) {
    if (!existingOrders.some((order) => order.orderNumber === i)) {
      missingOrders.push(i);
    }
  }

  // Step 3: Fetch Printify orders in batches
  let printifyOrders: PrintifyOrder[] = [];
  let pageNum = 1;
  let pageTolerance = 0;
  let allPrintifyData: any[] = [];
  const foundOrders: number[] = [];

  while (missingOrders.length > 0 && pageTolerance < 10 /**&& pageNum < 30 */) {
    if (pageTolerance !== 0) {
      pageTolerance += 1;
    }
    //get a batch of orders
    const printifyData = await fetch(printifyEndpoint + "?page=" + pageNum, {
      method: "GET",
      headers: printifyHeaders,
    }).then((response) => {
      if (!response.ok) {
        throw new Error(`Printify request failed! Status: ${response.status}`);
      }
      return response.json();
    });
    allPrintifyData = [...allPrintifyData, ...printifyData.data];
    console.log("alldatalengtgh", allPrintifyData.length);
    // console.log("printifyData: ", printifyData.data);
    //check if any of the missing orders are inside that batch
    // eslint-disable-next-line no-loop-func
    missingOrders.forEach(async (orderNum) => {
      // console.log("orderNum: ", orderNum);
      printifyData.data.forEach(async (order) => {
        // console.log("order: ", order);
        if (
          order.metadata.shop_order_label &&
          parseInt(order.metadata.shop_order_label.slice(1)) === orderNum
        ) {
          foundOrders.push(orderNum);
          console.log("found", orderNum);
          if (pageTolerance === 0) {
            pageTolerance = 1;
          }
          printifyOrders.push(order);
        }
      });
    });
    missingOrders = missingOrders.filter((order) => {
      return !foundOrders.includes(order);
    });

    pageNum = pageNum + 1;
  }

  // Step 4: Add Printify orders to the database
  let lastOrderNumber = 0;
  // const prismaPrintifyOrders = allPrintifyData
  //   .map((order) => {
  //     // Map Printify order properties to your PrintifyOrder model
  //     console.log("printify", order.metadata.shop_order_label);
  //     if (order.metadata.shop_order_label === undefined)
  //       return {
  //         orderNumber: lastOrderNumber - 1,
  //         printifyId: "",
  //         customerName: "",
  //         customerEmail: "",
  //         date: new Date(order.created_at),
  //         numLineItems: 0,
  //         totalShipping: 0,
  //         totalTax: 0,
  //         totalCost: 0,
  //       };
  //     lastOrderNumber = parseInt(order.metadata.shop_order_label.slice(1));
  //     return {
  //       orderNumber: parseInt(order.metadata.shop_order_label.slice(1)),
  //       printifyId: order.id,
  //       customerName: `${order.address_to.first_name} ${order.address_to.last_name}`,
  //       customerEmail: order.address_to.email,
  //       date: new Date(order.created_at),
  //       numLineItems: order.line_items.length,
  //       totalShipping: order.total_shipping,
  //       totalTax: order.total_tax,
  //       totalCost: order.total_price,
  //     };
  //   })
  //   .filter((order) => order);
  const foundPrismaOrders = printifyOrders
    .map((order) => {
      // Map Printify order properties to your PrintifyOrder model
      console.log("printify", order);
      if (order.metadata.shop_order_label === undefined) return null;
      return {
        orderNumber: parseInt(order.metadata.shop_order_label.slice(1)),
        printifyId: order.id,
        customerName: `${order.address_to.first_name} ${order.address_to.last_name}`,
        customerEmail: order.address_to.email,
        date: new Date(order.created_at),
        numLineItems: order.line_items.length,
        totalShipping: order.total_shipping,
        totalTax: order.total_tax,
        totalCost: order.total_price,
      };
    })
    .filter((order) => order);
  // await addPrintifyOrders(prismaPrintifyOrders);
  console.log("firstOrderNumber", firstOrderNum, lastOrderNum);
  let filteredOrders = [...foundPrismaOrders, ...existingOrders].filter(
    (order) => {
      return (
        order?.orderNumber >= firstOrderNum &&
        order?.orderNumber <= lastOrderNum
      );
    }
  );
  // for (let i = firstOrderNum; i <= lastOrderNum; i++) {
  //   console.log(
  //     filteredOrders.some((order) => order.orderNumber === i),
  //     i
  //   );
  // }
  return filteredOrders;
}
