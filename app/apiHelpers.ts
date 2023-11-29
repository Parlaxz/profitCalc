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

export function getShopifyGrossRevenue(
  shopifyRevenue: number,
  numItems: number
) {
  return shopifyRevenue * 0.971 - numItems * 0.3;
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
export async function getShopifyOrders(startDate: string, endDate: string) {
  const ShopifyID = "moshiproject";
  const shopifyAccessToken = process.env.SHOPIFY_ADMIN_API_ACCESS_TOKEN;
  const shopifyUrl = `https://${ShopifyID}.myshopify.com/admin/api/2023-04/graphql.json`;
  const shopifyHeaders = {
    "Content-Type": "application/json",
    "X-Shopify-Access-Token": shopifyAccessToken,
  };

  const ordersPerPage = 50;
  let hasNextPage = true;
  let cursor: string | null = null;
  let allShopifyOrders: ShopifyOrderData[] = [];

  while (hasNextPage) {
    const graphqlQuery = {
      query: `query ($cursor: String) {
          orders(first: ${ordersPerPage}, after: $cursor, query: "created_at:>${startDate} created_at:<${endDate}") {
            edges {
              cursor
              node {
                id
                name
                createdAt
                lineItems(first: 7) {
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
    console.log("shopifyData", shopifyData.data.orders.edges[0]);
    const orders = shopifyData.data.orders.edges;
    // console.log("orders", orders);
    hasNextPage = shopifyData.data.orders.pageInfo.hasNextPage;

    allShopifyOrders = [
      ...allShopifyOrders,
      ...orders.map((order: RawShopifyOrder) => {
        return {
          revenue: parseFloat(order?.node?.netPaymentSet?.shopMoney?.amount),
          customer: order?.node?.customer?.displayName
            ? order?.node?.customer?.displayName
            : "",
          createdAt: order?.node?.createdAt,
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

  console.log("allShopifyOrders[0]", allShopifyOrders[0]);

  const setMultipleResult = await setShopifyOrders(allShopifyOrders);
  console.log("Set Multiple Result:", setMultipleResult);
  return allShopifyOrders;
}
