import type { ActionFunctionArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { dateRangeCookie } from "~/cookies.server";

export async function action({ request }: ActionFunctionArgs) {
  console.log("reaached set cookies");

  try {
    const cookieHeader = request.headers.get("Cookie");
    const cookie = (await dateRangeCookie.parse(cookieHeader)) || {};
    const bodyParams = await request.formData();
    // Update the date range if form data is provided
    if (bodyParams.has("startDate") && bodyParams.has("endDate")) {
      const startDate = bodyParams.get("startDate");
      const endDate = bodyParams.get("endDate");

      cookie.startDate = startDate;
      cookie.endDate = endDate;

      // You can add additional validation if needed

      // Set the cookie with the updated date range
      return redirect("/", {
        headers: {
          "Set-Cookie": await dateRangeCookie.serialize(cookie),
        },
      });
    }

    return redirect("/");
  } catch (error) {
    console.error(error);
    return json({ error: "Failed to set Cookie Data" }, 500);
  }
}
