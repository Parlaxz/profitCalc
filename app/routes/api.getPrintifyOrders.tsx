import type { PrintifyOrder } from "@prisma/client";
import { json } from "@remix-run/node";
import { prisma } from "~/apiHelpers";

export async function action({ request }) {
  try {
    const data = await getFacebookAds(campaignId, accessToken);

    return json(data);
  } catch (error) {
    console.error(error);
    return json({ error: "Failed to fetch Facebook Ads data" }, 500);
  }
}
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

  // Function to fetch a batch of orders
  const fetchPrintifyBatch = async (pageNumber: number) => {
    const printifyData = await fetch(printifyEndpoint + "?page=" + pageNumber, {
      method: "GET",
      headers: printifyHeaders,
    }).then((response) => {
      if (!response.ok) {
        throw new Error(`Printify request failed! Status: ${response.status}`);
      }
      return response.json();
    });

    return printifyData.data;
  };

  while (missingOrders.length > 0 && pageTolerance < 10 && pageNum < 30) {
    if (pageTolerance !== 0) {
      pageTolerance += 1;
    }

    const batchPromises = [];

    // Fetch orders in batches of 10
    for (let i = 0; i < 5 && pageNum < 30; i++) {
      batchPromises.push(fetchPrintifyBatch(pageNum));
      pageNum += 1;
    }

    // Wait for all requests in the batch to complete
    const batches = await Promise.all(batchPromises);

    // Flatten the array of batches
    const printifyData = batches.flat();

    allPrintifyData = [...allPrintifyData, ...printifyData];

    // Check if any of the missing orders are inside that batch
    missingOrders.forEach((orderNum) => {
      printifyData.forEach((order) => {
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

    missingOrders = missingOrders.filter(
      (order) => !foundOrders.includes(order)
    );
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
      // console.log("printify", order);
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
