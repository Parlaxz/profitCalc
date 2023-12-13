import React, { useState, useEffect } from "react";

import { json } from "@remix-run/node";
import type { LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData, useRevalidator } from "@remix-run/react";
import { prisma } from "~/apiHelpers";
import { AtSymbolIcon } from "@heroicons/react/24/solid";

import "react-datepicker/dist/react-datepicker.css";

import ReactDatePicker, { type ReactDatePickerProps } from "react-datepicker";
import { Sidebar } from "./Sidebar";
import {
  BanknotesIcon,
  ShoppingCartIcon,
  CheckCircleIcon,
  VideoCameraIcon,
} from "@heroicons/react/24/outline";
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
  const currentDate = new Date();
  const oneHourAgo = new Date(currentDate.getTime() - (60 * 60 * 1000 * 1) / 1); // Subtracting hour in milliseconds

  // const liveUsers = await prisma.user.findMany({
  //   orderBy: [
  //     {
  //       timeUpdated: "desc",
  //     },
  //   ],
  //   where: {
  //     timeUpdated: {
  //       gte: oneHourAgo.toISOString(), // Using ISOString to match the format in the database
  //     },
  //   },
  // });
  const allUsers = await prisma.user.findMany({});
  const liveUsers = allUsers
    .filter((user) => {
      const timeUpdated = new Date(user.timeUpdated);
      return timeUpdated >= oneHourAgo;
    })
    .sort((a, b) => new Date(b.timeUpdated) - new Date(a.timeUpdated));
  return json({ liveUsers, allUsers });
}

export const meta = () => {
  return [
    { title: "New Remix App" },
    { name: "description", content: "Welcome to Remix!" },
  ];
};

// ./app/routes/index.tsx
export default function Index() {
  let revalidator = useRevalidator();
  useEffect(() => {
    // Define the revalidation function
    const revalidate = () => {
      // Assuming revalidator is available in the scope
      revalidator.revalidate();
    };

    // Set up an interval to call revalidate every 10 seconds
    const intervalId = setInterval(revalidate, 10000);

    // Clean up the interval when the component unmounts
    return () => clearInterval(intervalId);
  }, []); // Empty dependency array to ensure the effect runs only once on mount

  const loaderData = useLoaderData<typeof loader>();
  const [pageType, setPageType] = useState("tracking");
  const purchasers = loaderData?.allUsers?.filter((user) =>
    user.events.some((event) => event.type === "purchase")
  );
  console.log("purchasers", purchasers);
  const utmData = {};

  loaderData?.allUsers?.forEach((user) => {
    const utmSource = user.UTM?.utmSource;

    if (utmSource) {
      if (!utmData[utmSource]) {
        utmData[utmSource] = {};
      }

      user.events.forEach((event) => {
        const eventType = event.type;

        if (!utmData[utmSource][eventType]) {
          utmData[utmSource][eventType] = { count: 0, value: 0 };
        }

        utmData[utmSource][eventType].count++;
        utmData[utmSource][eventType].value += parseFloat(event.value) ?? 0;
      });
    }
  });

  console.log("utmData", utmData);

  return (
    <div className="max-h-screen h-screen bg-white flex justify-center items-center overflow-hidden">
      <Sidebar key={"pageType"} pageType={pageType} setPageType={setPageType} />
      <div></div>
      <div className="max-h-screen h-screen w-[87.5%] bg-white">
        <div className="flex items-center justify-between font-bold text-3xl p-8 pb-0">
          <div>Tracking Page</div>
        </div>
        {/* Main Body */}
        <div className="grid gap-8 grid-rows-1 grid-cols-5 w-full h-full p-8">
          <div className="col-span-2">
            <Card>
              <div className="max-h-full">
                <div>
                  <div className="w-fit h-fit p-2 bg-neutral-100 rounded-full">
                    <VideoCameraIcon className="h-8 w-8 " />
                  </div>
                  <div className="text-neutral-800 border-b text-2xl font-semibold border-neutral-200 mt-4 pb-4">
                    Live View{" "}
                    <span className="text-neutral-300 text-sm">(last 60m)</span>
                  </div>
                </div>
                <div className="flex flex-col overflow-auto pr-4 h-fit max-h-full">
                  {loaderData.liveUsers.map((user, index) => {
                    return <LiveUser user={user} key={"user" + index} />;
                  })}
                </div>
              </div>
            </Card>
          </div>
          <div className="col-span-3">
            <Card>
              <div className="flex flex-col h-max-full overflow-hidden">
                <div>
                  <div className="w-fit h-fit p-2 bg-neutral-100 rounded-full">
                    <AtSymbolIcon className="h-8 w-8 " />
                  </div>
                  <div className="text-neutral-800 border-b text-2xl font-semibold border-neutral-200 mt-4 pb-4">
                    UTM High Stakes Leaderboards
                  </div>
                </div>
                <div>
                  <UTMTable data={utmData} />
                </div>
              </div>
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
        "w-full h-full border-neutral-200 border rounded-2xl px-12 py-4 grid grid-flow-row gap-2 shadow-sm  max-h-[89vh] overflow-auto" +
        className
      }
    >
      {children}
    </div>
  );
};

function LiveUser({ user }) {
  const [displayIndex, setDisplayIndex] = useState(null);
  const currentDate = new Date();
  const eventDate = new Date(user?.timeUpdated); // Subtracting 1 hour in milliseconds
  const secondsElapsed = (currentDate.getTime() - eventDate.getTime()) / 1000;
  return (
    <>
      <div
        className={`${
          secondsElapsed > 60 * 10
            ? "border-neutral-200 border"
            : "border-neutral-400 border"
        }  p-4 rounded-md h-fit my-2 block overflow-hidden`}
      >
        <div className="flex items-center justify-between">
          <span>{user.ip}</span>
          <span className="text-neutral-500">
            {user?.UTM?.utmSource} / {user?.UTM?.utmMedium}
          </span>
        </div>
        <div className="flex overflow-x-auto pb-2">
          {" "}
          {user.events.map((event, index) => {
            const currentDate = new Date();
            const eventDate = new Date(event?.timeCreated); // Subtracting 1 hour in milliseconds
            const secondsElapsed =
              (currentDate.getTime() - eventDate.getTime()) / 1000;
            let displayedTime = Math.floor(secondsElapsed) + "s";
            if (secondsElapsed > 60) {
              displayedTime = Math.floor(secondsElapsed / 60) + "m";
            }

            return secondsElapsed > 60 * 60 * 3 ? (
              <></>
            ) : (
              <div
                key={"event" + index}
                className={`flex flex-col px-2 justify-center items-center border-gray-200 border rounded-lg mx-1 ${
                  event?.type === "purchase"
                    ? "bg-green-800 text-white font-semibold"
                    : event?.type === "InitiateCheckout"
                    ? "bg-yellow-600 text-white font-semibold"
                    : ""
                }  `}
              >
                <span>{event.value}</span>
                <button
                  onClick={() => {
                    setDisplayIndex(
                      Number.isInteger(displayIndex) ? null : index
                    );
                  }}
                >
                  {event?.type === "AddToCart" ? (
                    <ShoppingCartIcon className="h-6 w-6" />
                  ) : event?.type === "InitiateCheckout" ? (
                    <CheckCircleIcon className="h-6 w-6" />
                  ) : event?.type === "purchase" ? (
                    <BanknotesIcon className="h-6 w-6" />
                  ) : (
                    event?.type
                  )}
                </button>
                <span>{displayedTime}</span>
              </div>
            );
          })}
        </div>
        <div>
          {" "}
          {console.log(
            "user?.events[displayIndex]",
            user?.events[displayIndex]
          )}
          {Number.isInteger(displayIndex) ? (
            <div>{user?.events[displayIndex]?.value}</div>
          ) : (
            ""
          )}
          {Number.isInteger(displayIndex) &&
            (user?.events[displayIndex]?.lines?.map((line) => {
              return event?.type !== "InitiateCheckout"
                ? JSON.stringify(line)
                : "";
            }) ??
              "")}
        </div>
      </div>
    </>
  );
}

const UTMTable = ({ data }) => {
  // Convert the data object to an array and sort it by purchase count
  const sortedData = Object.entries(data)
    .sort(([aKey, a], [bKey, b]) => {
      const aPurchase = a?.purchase ?? { count: 0, value: 0 };
      const bPurchase = b?.purchase ?? { count: 0, value: 0 };

      if (bPurchase.count !== aPurchase.count) {
        return bPurchase.count - aPurchase.count; // Sort by purchase count
      } else {
        return bPurchase.value - aPurchase.value; // Sort by purchase value if counts are equal
      }
    })
    .map(([utmSource, events], index) => ({
      utmSource,
      events,
      index: index + 1,
    }));

  return (
    <div className="overflow-x-auto text-xs text-center">
      <table className="min-w-full bg-white border border-gray-300">
        <thead>
          <tr>
            <th className="py-2 px-4 border-b">Number</th>
            <th className="py-2 px-4 border-b">UTM Source</th>
            <th className="py-2 px-4 border-b">Add To Cart Count</th>
            <th className="py-2 px-4 border-b">Add To Cart Value</th>
            <th className="py-2 px-4 border-b">Checkout Count</th>
            <th className="py-2 px-4 border-b">Checkout Value</th>
            <th className="py-2 px-4 border-b">Purchase Count</th>
            <th className="py-2 px-4 border-b">Purchase Value</th>
          </tr>
        </thead>
        <tbody>
          {sortedData.map(({ utmSource, events, index }) => (
            <tr key={utmSource}>
              <td className="py-2 px-4 border-b">{index}</td>
              <td className="py-2 px-4 border-b">{utmSource}</td>
              <td className="py-2 px-4 border-b">
                {events?.AddToCart?.count ?? 0}
              </td>
              <td className="py-2 px-4 border-b">
                {events?.AddToCart?.value?.toFixed(2) ?? 0}
              </td>
              <td className="py-2 px-4 border-b">
                {(events?.InitiateCheckout?.count ?? 0) +
                  (events?.AcceleratedCheckout?.count ?? 0)}
              </td>
              <td className="py-2 px-4 border-b">
                {(
                  (events?.InitiateCheckout?.value ?? 0) +
                  (events?.AcceleratedCheckout?.value ?? 0)
                ).toFixed(2)}
              </td>
              <td className="py-2 px-4 border-b">
                {events?.purchase?.count ?? 0}
              </td>
              <td className="py-2 px-4 border-b">
                {events?.purchase?.value?.toFixed(2) ?? 0}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};