import { addPrintifyOrders } from "prisma/printifyOrderFunctions";
import type { RawShopifyOrder, ShopifyOrderType } from "./typeDefinitions";
import { PrintifyOrder, PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

//----------------------------------------------------------------
//generic Helpers
export function printStats(
  shopifyGrossRevenue: number,
  totalPrice: number,
  metaAds: number
) {
  console.log("gross shopify revenue: ", shopifyGrossRevenue.toFixed(2));
  console.log("printify total cost: ", totalPrice.toFixed(2));
  console.log("Meta Ads: ", metaAds.toFixed(2));
  console.log(
    "Big boi Profit: ",
    (shopifyGrossRevenue - totalPrice - metaAds - 21).toFixed(2)
  );
}
export function addDaysToDate(endDate: string, amount: number) {
  const endDateObject = new Date(endDate);
  endDateObject.setDate(endDateObject.getDate() + amount);
  endDate = endDateObject.toISOString().split("T")[0];
  return endDate;
}
function delay(seconds: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve();
    }, seconds * 1000);
  });
}

//----------------------------------------------------------------
//revenue Calculators
export function getPrintifyRevenue(
  printifyOrders: ({
    orderNumber: number;
    printifyId: any;
    customerName: string;
    customerEmail: any;
    date: Date;
    numLineItems: any;
    totalShipping: any;
    totalTax: any;
    totalCost: any;
  } | null)[]
) {
  let totalPrice = 0;
  printifyOrders.forEach(
    (order) =>
      (totalPrice +=
        order?.totalShipping / 100.0 +
        order?.totalTax / 100.0 +
        order?.totalCost / 100.0)
  );
  return totalPrice;
}

export function getShopifyRevenue(shopifyOrders: any[]) {
  let shopifyRevenue = 0;
  shopifyOrders.forEach((order: ShopifyOrderType) => {
    // console.log("shopifyRevenue", shopifyRevenue);
    shopifyRevenue += order.revenue;
  });
  return shopifyRevenue;
}

export function getShopifyGrossRevenue(shopifyRevenue: number) {
  return shopifyRevenue * 0.971 - 32 * 0.3;
}

//----------------------------------------------------------------
// API ORDER FETCHERS
export async function getShopifyOrders(startDate: string, endDate: string) {
  const ShopifyID = "moshiproject";
  const shopifyAccessToken = process.env.SHOPIFY_ADMIN_API_ACCESS_TOKEN;
  const shopifyUrl = `https://${ShopifyID}.myshopify.com/admin/api/2023-04/graphql.json`;
  const shopifyHeaders = {
    "Content-Type": "application/json",
    "X-Shopify-Access-Token": shopifyAccessToken,
  };

  const ordersPerPage = 100;
  let hasNextPage = true;
  let cursor: string | null = null;
  let allShopifyOrders: any[] = [];

  while (hasNextPage) {
    const graphqlQuery = {
      query: `query ($cursor: String) {
          orders(first: ${ordersPerPage}, after: $cursor, query: "created_at:>${startDate} created_at:<${endDate}") {
            edges {
              cursor
              node {
                id
                name
                sourceIdentifier
                fulfillments(first:10){
                  id
                }
                createdAt
                customer {
                  displayName
                }
                sourceIdentifier
                netPaymentSet {
                  shopMoney {
                    amount
                  }
                }
              }
            }
            pageInfo {
              hasNextPage
            }
          }
        }`,
      variables: {
        cursor: cursor,
      },
    };

    const shopifyData = await fetch(shopifyUrl, {
      method: "POST",
      headers: shopifyHeaders,
      body: JSON.stringify(graphqlQuery),
    }).then((response) => {
      if (!response.ok) {
        throw new Error(
          `Shopify GraphQL request failed! Status: ${response.status}`
        );
      }
      return response.json();
    });
    console.log("shopifyData", shopifyData);
    const orders = shopifyData.data.orders.edges;
    console.log("orders", orders);
    hasNextPage = shopifyData.data.orders.pageInfo.hasNextPage;

    allShopifyOrders = allShopifyOrders.concat(
      orders.map((order: RawShopifyOrder) => {
        return {
          id: order.node.id,
          sourceIdentifier: order.node.sourceIdentifier,
          revenue: parseFloat(order.node.netPaymentSet.shopMoney.amount),
          customer: order.node.customer.displayName,
          createdAt: order.node.createdAt,
          orderName: order.node.name.slice(1),
        };
      })
    );

    // Update cursor for the next page
    cursor = hasNextPage ? orders[orders.length - 1].cursor : null;
    await delay(2);
  }

  return allShopifyOrders;
}

export async function getPrintifyOrders(
  firstOrderNum: number,
  lastOrderNum: number
) {
  const printifyEndpoint =
    "https://api.printify.com/v1/shops/2666622/orders.json";
  const printifyAccessToken = process.env.PRINTIFY_API_TOKEN;

  const printifyHeaders = {
    Authorization: `Bearer ${printifyAccessToken}`,
  };

  // Step 1: Find existing orders in the database
  const existingOrders = await prisma.printifyOrder.findMany({
    where: {
      orderNumber: {
        gte: firstOrderNum,
        lte: lastOrderNum,
      },
    },
  });
  console.log("existingOrders", existingOrders);
  // Step 2: Find missing orders from Printify
  let missingOrders = [];
  // console.log("firstOrderNum", firstOrderNum, lastOrderNum);
  for (let i = firstOrderNum; i <= lastOrderNum; i++) {
    if (!existingOrders.some((order) => order.orderNumber === i)) {
      missingOrders.push(i);
    }
  }
  // console.log("missing orders: ", missingOrders);

  // Step 3: Fetch Printify orders in batches
  let printifyOrders: PrintifyOrder[] = [];
  let pageNum = 1;
  let pageTolerance = 0;
  let allPrintifyData: any[] = [];
  while (missingOrders.length > 0 && pageTolerance < 20 && pageNum < 130) {
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
    const foundOrders: number[] = [];
    // eslint-disable-next-line no-loop-func
    missingOrders.forEach(async (orderNum) => {
      // console.log("orderNum: ", orderNum);
      printifyData.data.forEach(async (order) => {
        // console.log("order: ", order);

        console.log(
          "order.metadata.shop_order_label",
          parseInt(
            order.metadata.shop_order_label
              ? order.metadata.shop_order_label.slice(1)
              : ""
          )
        );
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
  const prismaPrintifyOrders = allPrintifyData
    .map((order) => {
      // Map Printify order properties to your PrintifyOrder model
      console.log("printify", order.metadata.shop_order_label);
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

  await addPrintifyOrders(prismaPrintifyOrders);

  const filteredOrders = prismaPrintifyOrders
    .sort(function (a, b) {
      return a?.orderNumber - b?.orderNumber;
    })
    .filter((order) => {
      return (
        order?.orderNumber >= firstOrderNum &&
        order?.orderNumber <= lastOrderNum
      );
    });

  return [...existingOrders, ...filteredOrders];
}
