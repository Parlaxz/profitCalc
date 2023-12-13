import { addPrintifyOrders } from "prisma/printifyOrderFunctions";
import type {
  PrismaShopifyOrder,
  RawShopifyOrder,
  ShopifyOrderData,
  ShopifyOrderType,
} from "./typeDefinitions";
import { PrismaClient, ShopifyOrder } from "@prisma/client";
import {
  setShopifyOrder,
  setShopifyOrders,
} from "prisma/shopifyOrderFunctions";
import { getPrintifyOrders } from "./routes/api.getPrintifyOrders";
import { getAdBudget, getFacebookAds } from "./routes/api.getFacebookAds";

export const prisma = new PrismaClient();

//----------------------------------------------------------------
//generic Helpers
export function printStats(
  shopifyGrossRevenue: number,
  totalPrice: number,
  metaAds: number,
  cashback: number,
  extraCosts: number
) {
  console.log("gross shopify revenue: ", shopifyGrossRevenue.toFixed(2));
  console.log("printify total cost: ", totalPrice.toFixed(2));
  console.log("Meta Ads: ", metaAds.toFixed(2));
  console.log("Cashback: ", cashback.toFixed(2));
  console.log(
    "Big boi Profit: ",
    (shopifyGrossRevenue - totalPrice - metaAds - extraCosts).toFixed(2)
  );
  console.log(
    "Bigger boi Profit: ",
    (
      shopifyGrossRevenue -
      totalPrice -
      metaAds +
      cashback -
      extraCosts
    ).toFixed(2)
  );
}
export function addDaysToDate(endDate: string, amount: number) {
  const endDateObject = new Date(endDate);
  endDateObject.setDate(endDateObject.getDate() + amount);
  endDate = endDateObject.toISOString().split("T")[0];
  return endDate;
}
export function delay(seconds: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve();
    }, seconds * 1000);
  });
}

//----------------------------------------------------------------
//revenue Calculators
export function getPrintifyCost(
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
    shopifyRevenue += order.revenue;
  });
  return shopifyRevenue;
}

export function getShopifyGrossRevenue(
  shopifyRevenue: number,
  numOrders: number
) {
  return shopifyRevenue * 0.971 - numOrders * 0.3;
}
export function getNumItems(orders: ShopifyOrder[]) {
  let counter = 0;
  orders.forEach((order) => {
    counter += order.lineItems.length;
  });
  return counter;
}
//----------------------------------------------------------------
// API ORDER FETCHERS
export const getLatestOrder = async () => {
  const prisma = new PrismaClient();

  const latestOrder = await prisma.shopifyOrder.findFirst({
    orderBy: { orderNumber: "desc" },
  });
  console.log("latestOrder", latestOrder);
  return latestOrder;
};
export async function getShopifyOrders(startDate: string, endDate: string) {
  // Step 1: Get the latest order from the database (assuming you are using Prisma)

  // lastestOrder = getLatestOrder();

  // Step 3: Call updateShopifyOrders to update orders with today's date

  // console.time("update");

  // await updateShopifyOrders(
  //   latestOrder?.orderNumber ? latestOrder?.orderNumber : 1000
  // );
  // console.timeEnd("update");

  // Step 4: Get all orders from the database between startDate and endDate
  console.time("getAllOrders");

  const orders = await prisma.shopifyOrder.findMany({
    where: {
      AND: [{ createdAt: { gte: startDate } }, { createdAt: { lte: endDate } }],
    },
  });
  // Step 5: Return the orders
  console.timeEnd("getAllOrders");

  return orders;
}

export async function updateShopifyOrders(startOrderNumber: number) {
  const ShopifyID = "moshiproject";
  const shopifyAccessToken = process.env.SHOPIFY_ADMIN_API_ACCESS_TOKEN;
  const shopifyUrl = `https://${ShopifyID}.myshopify.com/admin/api/2023-04/graphql.json`;
  const shopifyHeaders = {
    "Content-Type": "application/json",
    "X-Shopify-Access-Token": shopifyAccessToken,
  };

  const ordersPerPage = 47;
  let hasNextPage = true;
  let cursor: string | null = null;
  let allShopifyOrders: ShopifyOrderData[] = [];

  while (hasNextPage) {
    console.time("finishGQLShopifyQuery");

    const graphqlQuery = {
      query: `query ($cursor: String) {
          orders(first: ${ordersPerPage}, after: $cursor, query: "name:>${startOrderNumber}") {
            edges {
              cursor
              node {
                id
                name
                createdAt
                lineItems(first: 8) {
                  edges {
                    node {
                      title
                      quantity
                      originalUnitPriceSet {
                        shopMoney {
                          amount
                        }
                      }
                    }
                  }
                }
                customer {
                  displayName
                }
                
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
    console.timeEnd("finishGQLShopifyQuery");

    console.log("shopifyData", shopifyData?.data?.orders?.edges[0]);
    const orders = shopifyData.data.orders.edges;
    hasNextPage = shopifyData.data.orders.pageInfo.hasNextPage;

    allShopifyOrders = [
      ...allShopifyOrders,
      ...orders.map((order: RawShopifyOrder) => {
        return {
          revenue: parseFloat(order?.node?.netPaymentSet?.shopMoney?.amount),
          customer: order?.node?.customer?.displayName
            ? order?.node?.customer?.displayName
            : "",
          createdAt: getOrderDate(order?.node?.createdAt),
          ip: "",
          orderNumber: parseInt(order?.node?.name?.slice(1)),
          lineItems: order?.node?.lineItems?.edges?.map((lineItem) => {
            return {
              title: lineItem?.node?.title,
              quantity: lineItem?.node?.quantity,
              price: lineItem?.node?.originalUnitPriceSet?.shopMoney?.amount,
            };
          }),
        };
      }),
    ];

    // Update cursor for the next page
    cursor = hasNextPage ? orders[orders.length - 1].cursor : null;
    if (hasNextPage)
      await delay(parseInt(shopifyData.extensions.cost.actualQueryCost) / 50);
  }

  const setMultipleResult = await setShopifyOrders(allShopifyOrders);
  prisma.shopifyOrder.createMany({
    data: allShopifyOrders,
  });
  if (allShopifyOrders.length > 0) {
    return allShopifyOrders;
  } else {
    console.log("All provided orderNumbers already exist in the database.");
    return null; // or handle it as per your requirement
  }

  return allShopifyOrders;
}

export async function getDateRangeData(endDate: string, startDate: string) {
  console.time("total");

  const extraCosts = 0;
  console.time("datePreset");

  let datePreset = getDatePreset(startDate, endDate);
  console.timeEnd("datePreset");

  const endDateAfter = addDaysToDate(endDate, 1);

  //Get Shopify Data
  console.log("Getting Shopify");
  console.time("Get Shopify Data");

  const shopifyOrders = await getShopifyOrders(startDate, endDate);
  const shopifyRevenue = getShopifyRevenue(shopifyOrders);
  console.timeEnd("Get Shopify Data");

  //Process Shopify Data
  console.log("Processing Shopify Data");
  console.time("Processing Shopify Data");

  const numOrders = shopifyOrders.length;
  const firstOrderNum = shopifyOrders.sort((a, b) => {
    return a?.orderNumber - b?.orderNumber;
  })[0]?.orderNumber;

  const lastOrderNum = shopifyOrders[shopifyOrders.length - 1]?.orderNumber;
  const shopifyGrossRevenue = getShopifyGrossRevenue(shopifyRevenue, numOrders);
  console.timeEnd("Processing Shopify Data");

  //Get Printify Data
  console.log("Printify");
  console.time("Printify");
  let printifyOrders = await getPrintifyOrders(firstOrderNum, lastOrderNum);

  let totalPrintifyCost = getPrintifyCost(printifyOrders);

  console.timeEnd("Printify");

  //get Facebook Data

  console.log("FB");
  console.time("FB");

  const campaignId = "120201248481810630";
  const adAccountId = "act_476856863674743";
  const fbAccessToken = process.env.FB_ACCESS_TOKEN;
  let metaAdsOverview = await getFacebookAds(
    adAccountId,
    fbAccessToken,
    startDate,
    endDate
  );
  console.timeEnd("FB");

  //get Facebook Budget Data
  console.time("Facebook Budget Data");

  metaAdsOverview = await Promise.all(
    metaAdsOverview.data.map(async (ad) => {
      const budget = await getAdBudget(ad.adset_id, fbAccessToken);
      ad.budget = (budget.daily_budget / 100.0).toFixed(2);
      return ad;
    })
  );
  console.timeEnd("Facebook Budget Data");

  //Process Facebook Data
  console.time("Process Facebook Data");

  let metaAdsFinal = 0;
  let metaAdsCurrent = 0;
  metaAdsOverview.forEach((ad) => {
    metaAdsFinal += parseFloat(ad.budget);
    metaAdsCurrent += parseFloat(ad.spend);
  });
  console.timeEnd("Process Facebook Data");

  //calculate total cashback
  let cashback = (totalPrintifyCost + metaAdsCurrent) * 0.03;

  //zip Printify and Shopify Order Data together
  console.time("zip");

  const ordersArray = [];
  console.log("firstOrderNum:", firstOrderNum, "numOrders:", numOrders);
  for (let i = firstOrderNum; i < firstOrderNum + numOrders; i++) {
    const printifyOrder = printifyOrders.find((order) => {
      return order?.orderNumber === i;
    });
    const shopifyOrder = shopifyOrders.find((order) => {
      return order?.orderNumber === i;
    });
    let order = {
      shopifyLineItems: shopifyOrder?.lineItems,
      printifyNumLineItems: printifyOrder?.numLineItems,
      orderNumber: i,
      orderDate: shopifyOrder?.createdAt,
      customerName: shopifyOrder?.customer,
      revenue: shopifyOrder?.revenue,
      cost: printifyOrder?.totalCost,
      shipping: printifyOrder?.totalShipping,
      tax: printifyOrder?.totalTax,
    };
    if (order.orderNumber && order.shopifyLineItems) {
      ordersArray.push(order);
    }
  }
  console.timeEnd("zip");

  const numItems = getNumItems(shopifyOrders);
  console.log("lastOrder", ordersArray[ordersArray.length - 1]);
  // printStats(
  //   shopifyGrossRevenue,
  //   totalPrintifyCost,
  //   metaAdsFinal,
  //   cashback,
  //   extraCosts
  // );
  console.timeEnd("total");

  const dailyProfit = (
    shopifyGrossRevenue -
    totalPrintifyCost -
    metaAdsFinal -
    extraCosts
  ).toFixed(2);

  const currentProfit = (
    shopifyGrossRevenue -
    totalPrintifyCost -
    metaAdsCurrent -
    extraCosts
  ).toFixed(2);

  const dateRangeData = {
    profit: { daily: dailyProfit, current: currentProfit },
    ads: { metaAdsOverview },
    meta: {
      dailyBudget: metaAdsFinal,
      currentSpend: metaAdsCurrent,
    },
    shopify: { revenue: shopifyRevenue, grossRevenue: shopifyGrossRevenue },
    printify: { cost: totalPrintifyCost },
    orders: ordersArray,
    datePreset: datePreset,
    stats: { cashback: cashback, numOrders: numOrders, numItems: numItems },
  };

  return dateRangeData;
}

function getDatePreset(startDate: string, endDate: string) {
  const currentDate = new Date().toLocaleDateString("en-CA");
  let datePreset = "custom";
  if (currentDate === startDate && currentDate === endDate) {
    datePreset = "today";
  } else if (
    addDaysToDate(currentDate, -1) === startDate &&
    addDaysToDate(currentDate, -1) === endDate
  ) {
    datePreset = "yesterday";
  } else if (
    currentDate === endDate &&
    addDaysToDate(currentDate, -6) === startDate
  ) {
    datePreset = "last7d";
  } else if (
    currentDate === endDate &&
    addDaysToDate(currentDate, -29) === startDate
  ) {
    datePreset = "last30d";
  }
  return datePreset;
}
// Utility function to get today's date in the format YYYY-MM-DD
function getCurrentDate() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
export const getOrderDate = (rawDate) => {
  const orderDate = new Date(`${rawDate}`);

  // Set the time zone offset for GMT-6 (CST)
  orderDate.setHours(orderDate.getHours());

  // Get the formatted date string in "YYYY-MM-DD" format
  const gmtMinus6Date = orderDate.toISOString().split("T")[0];
  return gmtMinus6Date;
};
