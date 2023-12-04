import React, { useState, useEffect } from "react";

import { json } from "@remix-run/node";
import type { LoaderFunctionArgs } from "@remix-run/node";
import { Form, Link, useActionData, useLoaderData } from "@remix-run/react";
import { delay, getDateRangeData, prisma } from "~/apiHelpers";
import {
  NewspaperIcon,
  ShoppingCartIcon,
  ArrowTrendingUpIcon,
  ShoppingBagIcon,
  PrinterIcon,
} from "@heroicons/react/24/solid";
import { OrderTable } from "../components/OrderTable";
import { Prisma } from "@prisma/client";
import { ResponsiveLine } from "@nivo/line";

import "react-datepicker/dist/react-datepicker.css";

import ReactDatePicker, { type ReactDatePickerProps } from "react-datepicker";
// @ts-ignore
const Picker = ReactDatePicker.default;
export const DatePicker = ({
  className,
  onChange,
  onBlur,
  selected,
}: ReactDatePickerProps) => (
  <Picker
    maxDate={new Date()}
    className={className}
    onChange={onChange}
    onBlur={onBlur}
    selected={selected}
  />
);
export async function loader({ request }: LoaderFunctionArgs) {
  const dailyAnalytics = await getDailyAnalytics();
  console.log(dailyAnalytics);
  // Update the cookie with the determined start and end dates
  return json(dailyAnalytics);
}
const getDailyAnalytics = async () => {
  // Step 1: Get the latest order from the database (assuming you are using Prisma)

  // Step 3: Call updateShopifyOrders to update orders with today's date
  await updateDailyAnalytics();

  // Step 4: Get all orders from the database between startDate and endDate
  const today = new Date();
  const currentYear = today.getFullYear();
  const startDateOfYear = `${currentYear}-01-01`;

  const dailyAnalytics = await prisma.dailyAnalytics.findMany({
    where: {
      date: {
        gte: startDateOfYear,
        lte: today.toISOString().split("T")[0], // Get today's date in 'YYYY-MM-DD' format
      },
    },
  });
  // Step 5: Return the orders
  return dailyAnalytics;
};

const updateDailyAnalytics = async () => {
  let latestDaySaved = await prisma.dailyAnalytics.findFirst({
    orderBy: { date: "desc" },
  });

  // Step 2: Get the date of the latest order
  let dateLatestDaySaved = latestDaySaved?.date ?? "";

  // If no latestDaySaved, start from the first day of the current year
  if (!dateLatestDaySaved) {
    const currentYear = new Date().getFullYear();
    dateLatestDaySaved = `${currentYear - 1}-12-31`;
  }

  // Step 3: For each day between dateLatestDaySaved and yesterday (GMT-6), run
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  let currentDate = new Date(dateLatestDaySaved);
  currentDate.setDate(currentDate.getDate() + 1); // Start from the day after dateLatestDaySaved

  while (currentDate < yesterday) {
    const formattedDate = currentDate.toISOString().split("T")[0]; // Get the date in YYYY-MM-DD format

    // Step 4: Call getDateRangeData and save the result on the backend
    const dateRangeData = await getDateRangeData(formattedDate, formattedDate);

    // Step 5: Save the result on the backend (replace this with your actual saving logic)
    await prisma.dailyAnalytics.create({
      data: {
        date: formattedDate,
        data: dateRangeData,
        expenses: [],
      },
    });

    // Move to the next day
    currentDate.setDate(currentDate.getDate() + 1);
    if (currentDate < yesterday) await delay(0.5);
  }
};

export const meta = () => {
  return [
    { title: "New Remix App" },
    { name: "description", content: "Welcome to Remix!" },
  ];
};

// ./app/routes/index.tsx
export default function Index() {
  var firstDay = new Date(new Date().getFullYear(), 0, 1);
  // .toISOString().split("T")[0];

  var now = new Date();
  var start = new Date(now.getFullYear(), 0, 0);
  var diff = now - start;
  var oneDay = 1000 * 60 * 60 * 24;
  var day = Math.floor(diff / oneDay);

  console.log(firstDay);
  const loaderData = useLoaderData<typeof loader>();
  const [pageType, setPageType] = useState("dashboard");
  const [pageData, setPageData] = useState(loaderData);
  const [startDate, setStartDate] = useState(firstDay);
  const [endDate, setEndDate] = useState(now);

  useEffect(() => {
    setPageData(loaderData);
  }, [loaderData]);
  console.log("pageData", pageData[1]);

  return (
    <div className="max-h-screen h-screen bg-white flex justify-center items-center">
      <Sidebar pageType={pageType} setPageType={setPageType} />
      <div></div>
      <div className="max-h-screen h-screen w-[87.5%] bg-white">
        <div className="flex items-center justify-between font-bold text-3xl p-8 pb-0">
          <div>Analytics Page</div>
        </div>
        {/* Main Body */}
        <div className="grid gap-8 grid-rows-2 w-full h-full p-8">
          <Card>
            <>
              {" "}
              <DatePicker
                selected={endDate}
                onChange={(date) => setEndDate(date)}
              />{" "}
              <DatePicker
                selected={startDate}
                onChange={(date) => setStartDate(date)}
              />
              {pageData.length > 0 && (
                <MyResponsiveLine dailyAnalytics={pageData} />
              )}
            </>
          </Card>
          <div className="grid gap-2 grid-cols-3">
            {" "}
            <Card>
              <>
                <div>
                  Profit:{" "}
                  {pageData
                    .reduce((sum, dataPoint) => {
                      return sum + parseFloat(dataPoint.data.profit.current);
                    }, 0)
                    .toFixed(2)}
                </div>
                <div>
                  Revenue:{" "}
                  {pageData
                    .reduce((sum, dataPoint) => {
                      return (
                        sum + parseFloat(dataPoint.data.shopify.grossRevenue)
                      );
                    }, 0)
                    .toFixed(2)}
                </div>
                <div>
                  Printing Cost:{" "}
                  {pageData
                    .reduce((sum, dataPoint) => {
                      return sum + parseFloat(dataPoint.data.printify.cost);
                    }, 0)
                    .toFixed(2)}
                </div>
                <div>
                  Ad Spend:{" "}
                  {pageData
                    .reduce((sum, dataPoint) => {
                      return sum + parseFloat(dataPoint.data.meta.currentSpend);
                    }, 0)
                    .toFixed(2)}
                </div>
                <div>
                  Expected Cashback:{" "}
                  {pageData
                    .reduce((sum, dataPoint) => {
                      return sum + parseFloat(dataPoint.data.stats.cashback);
                    }, 0)
                    .toFixed(2)}
                </div>
              </>
            </Card>{" "}
            <Card>
              <></>
            </Card>{" "}
            <Card>
              <></>
            </Card>
          </div>
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
export const Sidebar = (pageType, setPageType) => {
  const handlePageChange = (newPageType) => {
    setPageType(newPageType);
  };
  return (
    <div className="md:flex hidden text-base items-center flex-col h-[98%] w-[12.5%] bg-neutral-950 ml-1 rounded-3xl text-white">
      <div className="flex text-xl justify-center items-center w-full h-16 font-extrabold">
        MOSHI
      </div>
      <Link
        to="/"
        className={`w-[90%] rounded-lg py-2 my-2 ${
          pageType === "dashboard" ? "bg-neutral-800" : ""
        }`}
        onClick={() => handlePageChange("dashboard")}
      >
        Dashboard
      </Link>
      <Link
        to="/analytics"
        className={pageType === "analytics" ? "bg-blue-500" : ""}
        onClick={() => handlePageChange("analytics")}
      >
        Analytics
      </Link>
    </div>
  );
};

// DateButtons.jsx
const transformDataForLineChart = (dailyAnalyticsData) => {
  console.log("dailyAnalyticsData", dailyAnalyticsData[0]);
  return dailyAnalyticsData.map((analytics) => {
    console.log("analytics", analytics);
    return {
      x: analytics.date, // Assuming date is in the format 'YYYY-MM-DD'
      Profit: analytics.data.profit.current,
      "Ad Spend": analytics.data.meta.currentSpend,
      Revenue: analytics.data.shopify.grossRevenue,
      Cost: analytics.data.printify.cost,
    };
  });
};

const MyResponsiveLine = ({ dailyAnalytics }) => {
  console.log("dailyAnalytics", dailyAnalytics.length);
  const transformedData = transformDataForLineChart(dailyAnalytics);
  return (
    <ResponsiveLine
      data={[
        {
          id: "Profit",
          color: "hsl(120, 70%, 50%)",
          data: transformedData.map((point) => ({
            x: point.x,
            y: point.Profit,
          })),
        },
        // {
        //   id: "Ad Spend",
        //   color: "hsl(240, 70%, 50%)",
        //   data: transformedData.map((point) => ({
        //     x: point.x,
        //     y: point["Ad Spend"],
        //   })),
        // },
        {
          id: "Revenue",
          color: "hsl(60, 70%, 50%)",
          data: transformedData.map((point) => ({
            x: point.x,
            y: point.Revenue,
          })),
        },
        {
          id: "Cost",
          color: "hsl(0, 70%, 50%)",
          data: transformedData.map((point) => ({ x: point.x, y: point.Cost })),
        },
      ]}
      margin={{ top: 50, right: 110, bottom: 50, left: 60 }}
      xScale={{ type: "point" }}
      yScale={{
        type: "linear",
        min: "auto",
        max: "auto",
        stacked: true,
        reverse: false,
      }}
      yFormat=" >-.2f"
      curve="natural"
      axisTop={null}
      axisRight={null}
      axisBottom={{
        tickSize: 5,
        tickPadding: 5,
        tickRotation: 0,
        legend: "Date",
        legendOffset: 36,
        legendPosition: "middle",
      }}
      axisLeft={{
        tickSize: 5,
        tickPadding: 5,
        tickRotation: 0,
        legend: "amount($)",
        legendOffset: -40,
        legendPosition: "middle",
      }}
      enableGridX={false}
      pointSize={3}
      pointColor={{ theme: "background" }}
      pointBorderWidth={2}
      pointBorderColor={{ from: "serieColor" }}
      pointLabelYOffset={-12}
      useMesh={true}
      legends={[
        {
          anchor: "bottom-right",
          direction: "column",
          justify: false,
          translateX: 100,
          translateY: 0,
          itemsSpacing: 0,
          itemDirection: "left-to-right",
          itemWidth: 80,
          itemHeight: 20,
          itemOpacity: 0.75,
          symbolSize: 12,
          symbolShape: "circle",
          symbolBorderColor: "rgba(0, 0, 0, .5)",
          effects: [
            {
              on: "hover",
              style: {
                itemBackground: "rgba(0, 0, 0, .03)",
                itemOpacity: 1,
              },
            },
          ],
        },
      ]}
      // ... other props remain unchanged
    />
  );
};
