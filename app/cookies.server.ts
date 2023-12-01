// cookies.server.ts
import { createCookie } from "@remix-run/node";

export const dateRangeCookie = createCookie("date_range", {
  expires: new Date(Date.now() + 604800000), // one week
  httpOnly: true,
  path: "/",
  sameSite: "lax",
  secure: true,
});

// export additional functions related to the date range if needed
