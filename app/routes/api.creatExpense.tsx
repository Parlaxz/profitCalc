// api/setDateCookies.ts
import type { ActionFunctionArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { dateRangeCookie } from "~/cookies.server";

export async function action({ request }: ActionFunctionArgs) {
  try {
    const bodyParams = await request.formData();

    // Update the datePreset if form data is provided
    const startDate = bodyParams.get("startDate");
    const endDate = bodyParams.get("endDate");
    const amount = bodyParams.get("amount");
    const title = bodyParams.get("title");
    const frequency = bodyParams.get("frequency");
    const isRecurring = bodyParams.get("isRecurring");

    return redirect("/");
  } catch (error) {
    console.error(error);
    return json({ error: "Failed to set Cookie Data" }, 500);
  }
}
