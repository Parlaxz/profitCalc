import { json, redirect } from "@remix-run/node";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { Form, useActionData, useLoaderData } from "@remix-run/react";
import { addDaysToDate, getDateRangeData } from "~/apiHelpers";
import {
  NewspaperIcon,
  ShoppingCartIcon,
  ArrowTrendingUpIcon,
  ShoppingBagIcon,
  PrinterIcon,
} from "@heroicons/react/24/solid";
import React, { useState, useEffect } from "react";
import { OrderTable } from "../components/OrderTable";

import { dateRangeCookie } from "~/cookies.server";
import DateButton from "~/components/DateButton";

export async function loader({ request }: LoaderFunctionArgs) {
  // Extract date range values if available
  const cookieHeader = request.headers.get("Cookie");
  const cookie = (await dateRangeCookie.parse(cookieHeader)) || {};

  let { startDate, endDate } = cookie;
  // let startDate = "2023-11-25",
  //   endDate = "2023-11-30";
  if (!startDate) {
    startDate = "2023-11-29";
    cookie.startDate = startDate;
  }
  if (!endDate) {
    endDate = "2023-11-29";
    cookie.endDate = endDate;
  }
  console.log(startDate, endDate);
  // const ;
  // let endDate = "2023-11-29";
  //
  // let startDate = currentDate,
  //   endDate = currentDate;

  const dateRangeData = await getDateRangeData(endDate, startDate);
  console.log(cookie.startDate, cookie.endDate);
  return json(dateRangeData, {
    headers: {
      "Set-Cookie": await dateRangeCookie.serialize(cookie),
    },
  });
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
  const actionData = useActionData<typeof action>();
  const currentDate = new Date().toLocaleDateString("en-CA");

  const [pageData, setPageData] = useState(loaderData);
  useEffect(() => {
    setPageData(loaderData);
    console.log("actionData", actionData);
  }, [loaderData]);
  return (
    <div className="max-h-screen h-screen bg-white flex justify-center items-center">
      <div className="md:flex hidden  flex-col h-screen w-[12.5%] bg-neutral-100"></div>
      <div className="max-h-screen h-screen w-[87.5%] bg-white">
        <div className="flex items-center justify-between font-bold text-3xl p-8 pb-0">
          <div>Daily Dashboard</div>
          <div className="grid grid-rows-1 grid-flow-col gap-2">
            <DateButton
              text="today"
              selected={pageData.datePreset === "today"}
              startDate={currentDate}
              endDate={currentDate}
            />
            <DateButton
              text="yesterday"
              startDate={addDaysToDate(currentDate, -1)}
              endDate={addDaysToDate(currentDate, -1)}
              selected={pageData.datePreset === "yesterday"}
            />
            <DateButton
              text="Last 7 Days"
              startDate={addDaysToDate(currentDate, -6)}
              endDate={currentDate}
              selected={pageData.datePreset === "last7d"}
            />

            <span className="w-px bg-neutral-300"></span>
            <button className="text-white font-semibold text-base bg-gradient-to-tr from-cyan-500 to-blue-500 p-4 py-2 rounded-full">
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
              <Card className="text-white bg-gradient-to-tr from-cyan-500 to-blue-500 h-48">
                <>
                  <div className="w-fit h-fit p-2 rounded-full bg-gradient-to-tr from-cyan-800 to-blue-800">
                    <ArrowTrendingUpIcon className="h-8 w-8 text-white" />
                  </div>
                  <div className=" font-bold text-4xl">
                    ${pageData.profit.daily}
                    <span className="text-blue-300 text-xl">
                      / {pageData.profit.current}
                    </span>
                  </div>
                  <div className="text-neutral-100">Profit</div>
                </>
              </Card>
              <Card>
                <>
                  <div className="w-fit h-fit p-2 rounded-full bg-gradient-to-tr from-cyan-500 to-blue-500">
                    <NewspaperIcon className="h-8 w-8 text-white" />
                  </div>
                  <div className=" font-bold text-4xl">
                    ${pageData.meta.currentSpend.toFixed(2)}
                    <span className="text-neutral-300 text-xl">
                      / {pageData.meta.dailyBudget.toFixed(2)}
                    </span>
                  </div>
                  <div className="text-neutral-400">Facebook Spend</div>
                </>
              </Card>
              <Card>
                <>
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
                </>
              </Card>
              <Card>
                <>
                  {" "}
                  <div className="w-fit h-fit p-2 rounded-full bg-gradient-to-tr from-cyan-500 to-blue-500">
                    <PrinterIcon className="h-8 w-8 text-white" />
                  </div>
                  <div className=" font-bold text-4xl">
                    ${pageData.printify.cost.toFixed(2)}{" "}
                  </div>
                  <div className="text-neutral-400">Printify Cost</div>
                </>
              </Card>
            </div>
            <Card></Card>
          </div>
          <Card>
            <>
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
            </>
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
// DateButtons.jsx

function DateButtons() {
  return (
    <div>
      <Form method="post">
        <button
          type="submit"
          form="todayForm"
          className="text-blue-500 font-semibold text-base border-blue-500 border-2 p-4 py-2 rounded-full"
        >
          Today
        </button>
        <input type="hidden" name="startDate" value="today" form="todayForm" />
        <input type="hidden" name="endDate" value="today" form="todayForm" />

        <button
          type="submit"
          form="yesterdayForm"
          className="text-blue-500 font-semibold text-base border-blue-500 border-2 p-4 py-2 rounded-full"
        >
          Yesterday
        </button>
        <input
          type="hidden"
          name="startDate"
          value="yesterday"
          form="yesterdayForm"
        />
        <input
          type="hidden"
          name="endDate"
          value="yesterday"
          form="yesterdayForm"
        />

        <button
          type="submit"
          form="last7DaysForm"
          className="text-blue-500 font-semibold text-base border-blue-500 border-2 p-4 py-2 rounded-full"
        >
          Last 7 Days
        </button>
        <input
          type="hidden"
          name="startDate"
          value="last-7-days"
          form="last7DaysForm"
        />
        <input
          type="hidden"
          name="endDate"
          value="today"
          form="last7DaysForm"
        />

        <button
          type="submit"
          form="lastMonthForm"
          className="text-blue-500 font-semibold text-base border-blue-500 border-2 p-4 py-2 rounded-full"
        >
          Last Month
        </button>
        <input
          type="hidden"
          name="startDate"
          value="last-month"
          form="lastMonthForm"
        />
        <input
          type="hidden"
          name="endDate"
          value="today"
          form="lastMonthForm"
        />
      </Form>
    </div>
  );
}
