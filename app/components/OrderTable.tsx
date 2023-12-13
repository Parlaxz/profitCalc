import { ExclamationTriangleIcon } from "@heroicons/react/24/solid";
import React, { useState, useEffect } from "react";
import type { OrderTableProps } from "~/typeDefinitions";

// OrderTable.js
export const OrderTable: React.FC<OrderTableProps> = ({ orders }) => {
  const [expandedRow, setExpandedRow] = useState<number | null>(null);
  const [displayedOrders, setDisplayedOrders] = useState(orders);
  const [filterAliexpress, setFilterAliexpress] = useState(false);

  const aliexpressOrders = orders.filter((order) => {
    return order.shopifyLineItems.some((lineItem) =>
      ["figure", "3d", "lamp", "figurine"].some(function (v) {
        return lineItem?.title.indexOf(v) >= 0;
      })
    );
  });

  useEffect(() => {
    if (filterAliexpress) {
      setDisplayedOrders(aliexpressOrders);
    } else setDisplayedOrders(orders);
  }, [filterAliexpress, orders]);

  console.log("aliexpressOrders", aliexpressOrders);
  const handleRowClick = (index: number) => {
    setExpandedRow(expandedRow === index ? null : index);
  };
  useEffect(() => {
    if (orders) orders.reverse();
  }, []);

  return (
    <div className="container mx-auto mt-8 overflow-scroll text-center">
      <button onClick={() => setFilterAliexpress(!filterAliexpress)}>
        Aliexpress
      </button>
      <table className="min-w-full bg-white">
        <thead>
          <tr>
            <th className="py-2 px-4 border-b">Order #</th>
            <th className="py-2 px-4 border-b">Customer Name</th>
            <th className="py-2 px-4 border-b">Shopify #Items</th>
            <th className="py-2 px-4 border-b">Printify #Items</th>
            <th className="py-2 px-4 border-b">Revenue</th>
            <th className="py-2 px-4 border-b">Cost</th>
            <th className="py-2 px-4 border-b">Profit</th>
          </tr>
        </thead>
        <tbody>
          {displayedOrders &&
            displayedOrders
              .sort((a, b) => {
                return b.orderNumber - a?.orderNumber;
              })
              .map((order, index) => (
                <React.Fragment key={index}>
                  <tr
                    className="cursor-pointer transition-all hover:bg-gray-100"
                    onClick={() => handleRowClick(index)}
                  >
                    <td className="py-2 px-4 border-b h-full ">
                      {order.orderNumber}
                      {order.printifyNumLineItems !==
                        order.shopifyLineItems?.length && (
                        <ExclamationTriangleIcon className="h-4 w-4 text-red-600 ml-2" />
                      )}
                    </td>
                    <td className="py-2 px-4 border-b">{order.customerName}</td>
                    <td className="py-2 px-4 border-b">
                      {order.shopifyLineItems.length}
                    </td>
                    <td className="py-2 px-4 border-b">
                      {order.printifyNumLineItems}
                    </td>
                    <td className="py-2 px-4 border-b">
                      ${Math.round(parseFloat(order.revenue))}
                    </td>
                    <td className="py-2 px-4 border-b">
                      $
                      {order.cost
                        ? Math.round(
                            (order.cost + order.shipping + order.tax) / 100
                          ).toFixed(0)
                        : ""}
                    </td>
                    <td className="py-2 px-4 border-b">
                      $
                      {Math.round(
                        order.revenue -
                          (order.cost + order.shipping + order.tax) / 100
                      ).toFixed(0)}
                    </td>
                  </tr>
                  {expandedRow === index && (
                    <tr>
                      <td colSpan={7}>
                        <div className="p-4">
                          {/* ... (existing content) */}
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
