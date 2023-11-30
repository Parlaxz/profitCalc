import { json, type MetaFunction } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import {
  addDaysToDate,
  getNumItems,
  getPrintifyRevenue,
  getShopifyGrossRevenue,
  getShopifyOrders,
  getShopifyRevenue,
  printStats,
} from "~/apiHelpers";
import { getAdBudget, getFacebookAds } from "./api.getFacebookAds";
import { getPrintifyOrders } from "./api.getPrintifyOrders";
import {
  NewspaperIcon,
  ShoppingCartIcon,
  ExclamationTriangleIcon,
  ArrowTrendingUpIcon,
  ShoppingBagIcon,
} from "@heroicons/react/24/solid";
import React, { useState } from "react";

export async function loader() {
  //config
  const extraCosts = 0;
  const startDate = "2023-11-29";
  let endDate = "2023-11-29";
  endDate = addDaysToDate(endDate, 1);

  const shopifyOrders = await getShopifyOrders(startDate, endDate);
  const shopifyRevenue = getShopifyRevenue(shopifyOrders);
  const numItems = getNumItems(shopifyOrders);
  const firstOrderNum = shopifyOrders[0].orderNumber;
  const lastOrderNum = shopifyOrders[shopifyOrders.length - 1].orderNumber;

  const shopifyGrossRevenue = getShopifyGrossRevenue(shopifyRevenue, numItems);
  let printifyOrders = await getPrintifyOrders(firstOrderNum, lastOrderNum);
  let totalPrice = getPrintifyRevenue(printifyOrders);
  console.log("shopify number orders: " + shopifyOrders.length);
  console.log("printify number orders: " + printifyOrders.length);
  console.log("shopifyRevenue", shopifyRevenue);
  const campaignId = "120201248481810630"; // Replace with your ad set ID
  const fbAccessToken =
    "EAAKS4ZCAJQzEBOxkNSrH4dgNHMbmjPiitOGvZAam32xzc4lAZBuTxwTwR4mrekcovztqzVQQYamSryYGMpJFdpZCfMoRPbxroGF6CPkTscLcvcfJJiWZBU5BFOYdx4UdZC9GH4ezZAQcZCDdvsZBmxYSqNn6gzEGyeLmdoMjYoYKVjceWVZB2dUoGx50XZANaftZBAreGH7drnEf"; // Replace with your access token

  let metaAdsOverview = await getFacebookAds(campaignId, fbAccessToken);

  metaAdsOverview = await Promise.all(
    metaAdsOverview.data.map(async (ad) => {
      const budget = await getAdBudget(ad.adset_id, fbAccessToken);
      console.log("budget", budget);
      ad.budget = (budget.daily_budget / 100.0).toFixed(2);
      return ad;
    })
  );
  let metaAdsFinal = 0;
  let metaAdsCurrent = 0;
  console.log("metaAdsOverview", metaAdsOverview);
  metaAdsOverview.forEach((ad) => {
    metaAdsFinal += parseFloat(ad.budget);
    metaAdsCurrent += parseFloat(ad.spend);
  });
  console.log("metaAdsFinal", metaAdsFinal);
  console.log("metaAdsCurrent", metaAdsCurrent);
  let cashback = (totalPrice + metaAdsFinal) * 0.03;
  const ordersArray = [];
  const numOrders = shopifyOrders.length;
  for (let i = firstOrderNum; i < firstOrderNum + numOrders; i++) {
    const printifyOrder = printifyOrders.find((order) => {
      return order?.orderNumber === i;
    });
    const shopifyOrder = shopifyOrders.find((order) => {
      return order?.orderNumber === i;
    });
    let order = {
      shopifyNumLineItems: shopifyOrder?.lineItems?.length,
      printifyNumLineItems: printifyOrder?.numLineItems,
      orderNumber: i,
      orderDate: shopifyOrder?.createdAt,
      customerName: shopifyOrder?.customer,
      revenue: shopifyOrder?.revenue,
      cost: printifyOrder?.totalCost,
      shipping: printifyOrder?.totalShipping,
      tax: printifyOrder?.totalTax,
    };
    console.log("order", order);
    ordersArray.push(order);
  }
  printStats(
    shopifyGrossRevenue,
    totalPrice,
    metaAdsFinal,
    cashback,
    extraCosts
  );
  const profit = (
    shopifyGrossRevenue -
    totalPrice -
    metaAdsFinal -
    extraCosts
  ).toFixed(2);
  return json({
    profit: profit,
    ads: { metaAdsOverview },
    meta: {
      dailyBudget: metaAdsFinal,
      currentSpend: metaAdsCurrent,
    },
    shopify: { revenue: shopifyRevenue, grossRevenue: shopifyGrossRevenue },
    orders: ordersArray,
  });
}

export const meta: MetaFunction = () => {
  return [
    { title: "New Remix App" },
    { name: "description", content: "Welcome to Remix!" },
  ];
};

// ./app/routes/index.tsx
export default function Index() {
  const loaderData = useLoaderData<typeof loader>();
  const [pageData, setPageData] = useState(loaderData);
  return (
    <div className="max-h-screen h-screen bg-white flex justify-center items-center">
      <div className="flex flex-col h-screen w-1/6 bg-neutral-100"></div>
      <div className="max-h-screen h-screen w-5/6 bg-white">
        <div className="flex items-center justify-between font-bold text-3xl p-8 pb-0">
          <div>Daily Dashboard</div>
          <button className="text-white font-semibold text-base bg-gradient-to-tr from-cyan-500 to-blue-500 p-4 py-2 rounded-full">
            Refresh All
          </button>
        </div>
        {/* Main Body */}
        <div className="grid grid-cols-2 grid-rows-1 gap-8 w-full h-full p-8">
          {" "}
          <div className="grid grid-rows-2 grid-cols-1 gap-8">
            {" "}
            <div className="grid grid-cols-2 grid-rows-2 gap-4 w-full h-full ">
              <Card className="text-white bg-gradient-to-tr from-cyan-500 to-blue-500">
                <div className="w-fit h-fit p-2 rounded-full bg-gradient-to-tr from-cyan-800 to-blue-800">
                  <ArrowTrendingUpIcon className="h-8 w-8 text-white" />
                </div>
                <div className=" font-bold text-5xl">${pageData.profit}</div>
                <div className="text-neutral-100">Profit</div>
              </Card>
              <Card>
                {" "}
                <div className="w-fit h-fit p-2 rounded-full bg-gradient-to-tr from-cyan-500 to-blue-500">
                  <NewspaperIcon className="h-8 w-8 text-white" />
                </div>
                <div className=" font-bold text-4xl">
                  ${pageData.meta.currentSpend.toFixed(2)}/
                  {pageData.meta.dailyBudget.toFixed(2)}
                </div>
                <div className="text-neutral-400">Facebook Spend</div>
              </Card>
              <Card>
                {" "}
                <div className="w-fit h-fit p-2 rounded-full bg-gradient-to-tr from-cyan-500 to-blue-500">
                  <ShoppingBagIcon className="h-8 w-8 text-white" />
                </div>
                <div className=" font-bold text-4xl">
                  ${pageData.shopify.grossRevenue.toFixed(2)}{" "}
                  <span className="text-neutral-300 text-xl">
                    / {pageData.shopify.revenue.toFixed(2)}
                  </span>
                </div>
                <div className="text-neutral-400">Shopify Revenue</div>
              </Card>
              <Card></Card>
            </div>
            <Card></Card>
          </div>
          <Card>
            {" "}
            <div>
              <div className="w-fit h-fit p-2 bg-neutral-100 rounded-full">
                <ShoppingCartIcon className="h-8 w-8 " />
              </div>
              <div className="text-neutral-800 border-b text-2xl font-semibold border-neutral-200 mt-4 pb-4">
                Orders
              </div>
            </div>
            <OrderTable orders={pageData.orders} />
          </Card>
        </div>
      </div>
    </div>
  );
}

const Card = ({ children = <></>, className = "" }) => {
  return (
    <div
      className={
        "w-full h-full border-neutral-200 border rounded-2xl px-12 py-4 grid grid-flow-row gap-2 shadow-sm " +
        className
      }
    >
      {children}
    </div>
  );
};
// OrderTable.js

interface OrderTableProps {
  orders: Order[];
}
interface Order {
  shopifyNumLineItems?: number;
  printifyNumLineItems?: number;
  orderNumber?: number;
  orderDate?: string;
  customerName?: string;
  revenue?: number;
  cost?: number;
  shipping?: number;
  tax?: number;
}
const OrderTable: React.FC<OrderTableProps> = ({ orders }) => {
  const [expandedRow, setExpandedRow] = useState<number | null>(null);

  const handleRowClick = (index: number) => {
    setExpandedRow(expandedRow === index ? null : index);
  };

  return (
    <div className="container mx-auto mt-8 overflow-scroll">
      <table className="min-w-full bg-white">
        <thead>
          <tr>
            <th className="py-2 px-4 border-b">Order #</th>
            <th className="py-2 px-4 border-b">Customer Name</th>
            <th className="py-2 px-4 border-b">Shopify #Items</th>
            <th className="py-2 px-4 border-b">Printify #Items</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((order, index) => (
            <React.Fragment key={index}>
              <tr
                className="cursor-pointer transition-all hover:bg-gray-100"
                onClick={() => handleRowClick(index)}
              >
                <td className="py-2 px-4 border-b flex items-center">
                  {order.orderNumber}
                  {order.printifyNumLineItems !== order.shopifyNumLineItems && (
                    <ExclamationTriangleIcon className="h-4 w-4 text-red-600 ml-2" />
                  )}
                </td>
                <td className="py-2 px-4 border-b">{order.customerName}</td>
                <td className="py-2 px-4 border-b">
                  {order.shopifyNumLineItems}
                </td>
                <td className="py-2 px-4 border-b">
                  {order.printifyNumLineItems}
                </td>
              </tr>
              {expandedRow === index && (
                <tr>
                  <td colSpan={4}>
                    <div className="p-4">
                      <p>Order Date: {order.orderDate}</p>
                      <p>Revenue: ${order.revenue}</p>
                      <p>
                        Product Cost: $
                        {order.cost ? (order.cost / 100).toFixed(2) : ""}
                      </p>
                      <p>
                        Shipping: $
                        {order.shipping
                          ? (order.shipping / 100).toFixed(2)
                          : ""}
                      </p>
                      <p>
                        Tax: ${order.tax ? (order.tax / 100).toFixed(2) : ""}
                      </p>
                      {/* Add more details as needed */}
                    </div>
                  </td>
                </tr>
              )}
            </React.Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
};
