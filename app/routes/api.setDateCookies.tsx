// api/setDateCookies.ts
import type { ActionFunctionArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { dateRangeCookie } from "~/cookies.server";

export async function action({ request }: ActionFunctionArgs) {
  try {
    const cookieHeader = request.headers.get("Cookie");
    const cookie = (await dateRangeCookie.parse(cookieHeader)) || {};
    const bodyParams = await request.formData();

    // Update the datePreset if form data is provided
    if (bodyParams.has("datePreset")) {
      const datePreset = bodyParams.get("datePreset");

      cookie.datePreset = datePreset;
      // Clear explicit start and end dates
      delete cookie.startDate;
      delete cookie.endDate;

      // Set the cookie with the updated datePreset
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
