import { defer, json, redirect } from "@remix-run/node";
import type {
  ActionFunction,
  ActionFunctionArgs,
  LoaderFunctionArgs,
} from "@remix-run/node";
import { Form, useActionData, useLoaderData } from "@remix-run/react";
import {
  addDaysToDate,
  getDateRangeData,
  getLatestOrder,
  updateShopifyOrders,
} from "~/apiHelpers";
import {
  NewspaperIcon,
  ShoppingCartIcon,
  ArrowTrendingUpIcon,
  ShoppingBagIcon,
  PrinterIcon,
} from "@heroicons/react/24/solid";
import React, { useState, useEffect } from "react";
import { OrderTable } from "../components/OrderTable";
import { Card } from "./tracking";

import { dateRangeCookie } from "~/cookies.server";
import DateButton from "~/components/DateButton";
import { Sidebar } from "./Sidebar";

// loader.ts

export async function loader({ request }: LoaderFunctionArgs) {
  // Extract datePreset and explicit start and end dates if available
  const cookieHeader = request.headers.get("Cookie");
  const cookie = (await dateRangeCookie.parse(cookieHeader)) || {};

  let { datePreset } = cookie;
  console.log("cookie", cookie);
  // Set default datePreset if not provided
  if (!datePreset || datePreset === "undefined") {
    datePreset = "today";
    cookie.datePreset = datePreset;
  }
  console.log("datePreset", datePreset);
  // Determine start and end dates based on the datePreset

  const { startDate: defaultStartDate, endDate: defaultEndDate } =
    await getDefaultDateRange(datePreset);
  const startDate = defaultStartDate;
  const endDate = defaultEndDate;
  // Fetch data based on start and end dates
  const dateRangeData = await getDateRangeData(endDate, startDate);

  // Update the cookie with the determined start and end dates
  return defer(dateRangeData, {
    headers: {
      "Set-Cookie": await dateRangeCookie.serialize(cookie),
    },
  });
}

export async function getDefaultDateRange(datePreset: string) {
  const today = new Date();
  today.setHours(today.getHours()); // Adjust to GMT-6

  const options = { timeZone: "America/Belize" };
  const formattedToday = today.toLocaleDateString("en-CA", options);

  switch (datePreset) {
    case "today":
      return { startDate: formattedToday, endDate: formattedToday };
    case "yesterday":
      const yesterday = new Date(today);
      yesterday.setDate(today.getDate() - 1);
      const formattedYesterday = yesterday.toLocaleDateString("en-CA", options);
      return { startDate: formattedYesterday, endDate: formattedYesterday };
    case "last7d":
      const last7DaysStart = new Date(today);
      last7DaysStart.setDate(today.getDate() - 6);
      const formattedLast7DaysStart = last7DaysStart.toLocaleDateString(
        "en-CA",
        options
      );
      return { startDate: formattedLast7DaysStart, endDate: formattedToday };
    case "last30d":
      const last30DaysStart = new Date(today);
      last30DaysStart.setDate(today.getDate() - 29);
      const formattedLast30DaysStart = last30DaysStart.toLocaleDateString(
        "en-CA",
        options
      );
      return { startDate: formattedLast30DaysStart, endDate: formattedToday };
    // Add more cases for other date presets if needed
    default:
      return { startDate: formattedToday, endDate: formattedToday };
  }
}

export const meta = () => {
  return [
    { title: "New Remix App" },
    { name: "description", content: "Welcome to Remix!" },
  ];
};

// ./app/routes/index.tsx
export default function Index() {
  const loaderData = useLoaderData<typeof loader>();

  const [pageType, setPageType] = useState("dashboard");
  const [pageData, setPageData] = useState(loaderData);
  useEffect(() => {
    setPageData(loaderData);
  }, [loaderData]);

  return (
    <div className="max-h-screen h-screen  bg-white dark:bg-gray-950 flex justify-center items-center">
      <Sidebar pageType={pageType} setPageType={setPageType} />

      {DashboardPage(pageData)}
    </div>
  );
}

function DashboardPage(pageData) {
  console.log("datepresetttt", pageData?.datePreset);
  return (
    <div className="max-h-screen dark:bg-gray-950 h-screen w-screen md:w-[87.5%] bg-white overflow-scroll">
      <div className="flex items-center justify-between font-bold text-3xl p-8 pb-0">
        <div className={"md:text-base text-sm"}>Daily Dashboard</div>
        <div className="grid grid-rows-1 grid-flow-col gap-2">
          <div className="grid md:grid-flow-col md:gap-2">
            <DateButton
              text="today"
              datePreset="today"
              selected={pageData?.datePreset === "today"}
            />
            <DateButton
              text="yesterday"
              datePreset="yesterday"
              selected={pageData?.datePreset === "yesterday"}
            />
          </div>
          <div className="hidden md:grid md:grid-flow-col gap-2">
            {" "}
            <DateButton
              text="Last 7 Days"
              datePreset="last7d"
              selected={pageData?.datePreset === "last7d"}
            />
            <DateButton
              text="Last 30 Days"
              datePreset="last30d"
              selected={pageData?.datePreset === "last30d"}
            />
          </div>

          <span className="hidden md:block w-px dark:bg-neutral-600 bg-neutral-300"></span>
          <button
            onClick={async () => {
              try {
                const response = await fetch("/api/manualOrderUpdate", {
                  method: "GET",
                  // You can add headers or other configurations as needed
                });

                if (!response.ok) {
                  throw new Error(`HTTP error! Status: ${response.status}`);
                }

                const data = await response.json();
                // Handle the data as needed
                console.log("Data:", data);
              } catch (error) {
                console.error("Error:", error.message);
              }
            }}
            className="hidden md:block dark:text-black text-white font-semibold text-base bg-gradient-to-tr dark:from-cyan-600 dark:to-blue-600 from-cyan-500 to-blue-500 p-4 py-2 rounded-full"
          >
            Refresh All
          </button>
        </div>
      </div>
      {/* Main Body */}
      <div className="grid grid-cols-1 md:grid-cols-2 md:grid-rows-1 gap-8 w-full h-full md:p-8">
        {" "}
        <div className="grid  md:grid-rows-2 grid-cols-1 gap-8">
          {" "}
          <div className="grid grid-cols-1 md:grid-cols-2 md:grid-rows-2 gap-4 w-full h-full ">
            <Card className="dark:text-black text-white bg-gradient-to-tr dark:from-cyan-600 dark:to-blue-600 from-cyan-500 to-blue-500 h-48">
              <>
                <div className="w-fit h-fit p-2 rounded-full bg-gradient-to-tr dark:from-cyan-500 dark:to-blue-500 from-cyan-800 to-blue-800">
                  <ArrowTrendingUpIcon className="h-8 w-8 dark:text-black text-white" />
                </div>
                <div className=" font-bold text-4xl  text-white">
                  ${pageData?.profit?.current}
                  <span className="text-blue-300 dark:text-blue-200 text-xl">
                    / {pageData?.profit?.daily}
                  </span>
                </div>
                <div className="text-neutral-100 dark:text-neutral-900">
                  Profit
                </div>
              </>
            </Card>
            <Card>
              <>
                <div className="w-fit h-fit p-2 rounded-full bg-gradient-to-tr from-cyan-500 to-blue-500 dark:from-cyan-600 dark:to-blue-600">
                  <NewspaperIcon className="h-8 w-8 text-white dark:text-gray-950" />
                </div>
                <div className=" font-bold text-4xl dark:text-white">
                  ${pageData?.meta?.currentSpend.toFixed(2)}
                  <span className="text-neutral-300 text-xl">
                    / {pageData?.meta?.dailyBudget.toFixed(2)}
                  </span>
                </div>
                <div className="text-neutral-400 dark:text-neutral-600">
                  Facebook Spend
                </div>
              </>
            </Card>
            <Card>
              <>
                <div className="w-fit h-fit p-2 rounded-full bg-gradient-to-tr from-cyan-500 to-blue-500 dark:from-cyan-600 dark:to-blue-600">
                  <ShoppingBagIcon className="h-8 w-8 text-white dark:text-gray-950" />
                </div>
                <div className=" font-bold text-4xl dark:text-white">
                  ${pageData?.shopify?.grossRevenue?.toFixed(2)}
                  <span className="text-neutral-300 text-xl">
                    / {pageData?.shopify?.revenue?.toFixed(2)}
                  </span>
                </div>
                <div className="text-neutral-400dark:text-neutral-600">
                  Shopify Revenue
                </div>
              </>
            </Card>
            <Card>
              <>
                <div className="w-fit h-fit p-2 rounded-full bg-gradient-to-tr from-cyan-500 to-blue-500 dark:from-cyan-600 dark:to-blue-600">
                  <PrinterIcon className="h-8 w-8 text-white dark:text-gray-950" />
                </div>
                <div className=" font-bold text-4xl dark:text-white">
                  ${pageData?.printify?.cost?.toFixed(2)}
                </div>
                <div className="text-neutral-400">Printify Cost</div>
              </>
            </Card>
          </div>
          <div className="grid grid-flow-col grid-cols-2 gap-4">
            <Card>
              <div>
                <div className=" flex justify-between dark:bg-blue-700 bg-blue-400 text-white rounded-3xl h-10 w-full mt-4 items-center font-bold px-4">
                  <span>Cashback:</span>
                  <span>${pageData?.stats?.cashback?.toFixed(2)}</span>
                </div>
                <div className=" flex justify-between dark:bg-blue-700 bg-blue-400 text-white rounded-3xl h-10 w-full mt-4 items-center font-bold px-4">
                  <span>Total Items:</span>
                  <span>{pageData?.stats?.numItems}</span>
                </div>
                <div className=" flex justify-between dark:bg-blue-700 bg-blue-400 text-white rounded-3xl h-10 w-full mt-4 items-center font-bold px-4">
                  <span>Total Orders:</span>
                  <span>{pageData?.stats?.numOrders}</span>
                </div>
                <div className=" flex justify-between dark:bg-blue-700 bg-blue-400 text-white rounded-3xl h-10 w-full mt-4 items-center font-bold px-4">
                  <span>Daily CPC:</span>
                  <span>
                    $
                    {(
                      pageData?.meta?.currentSpend / pageData?.meta?.numClicks
                    ).toFixed(2)}
                  </span>
                </div>
                <div className=" flex justify-between dark:bg-blue-700 bg-blue-400 text-white rounded-3xl h-10 w-full mt-4 items-center font-bold px-4">
                  <span>CPM</span>
                  <span>${pageData?.meta?.cpm.toFixed(2)}</span>
                </div>
              </div>
            </Card>
            <Card></Card>
          </div>
        </div>
        <Card>
          <div className="flex flex-col h-max-full overflow-hidden">
            <div>
              <div className="w-fit h-fit p-2 bg-neutral-100 dark:bg-neutral-800 dark:text-white rounded-full">
                <ShoppingCartIcon className="h-8 w-8 " />
              </div>
              <div className="text-neutral-800 dark:text-neutral-400 border-b text-2xl font-semibold border-neutral-200 mt-4 pb-4">
                Orders
              </div>
            </div>
            <OrderTable orders={pageData?.orders} />
          </div>
        </Card>
      </div>
    </div>
  );
}
