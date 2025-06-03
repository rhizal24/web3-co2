import { NextResponse } from "next/server";

const isAuthPage = (pathname) => {
  return pathname === "/sign-in" || pathname === "/sign-up";
};

export function middleware(request) {
  // const user = request.cookies.get("access_token");
  // // Arahin ke sign-in page
  // if (!user && !isAuthPage(request.nextUrl.pathname)) {
  //   return NextResponse.redirect(new URL("/sign-in", request.url));
  // }

  // // Arahin ke dashboard
  // if (user && isAuthPage(request.nextUrl.pathname)) {
  //   return NextResponse.redirect(new URL("/dashboard", request.url));
  // }

  return NextResponse.next();
}

export const config = {
  // matcher: ["/sign-in", "/sign-up", "/dashboard/:path*"],
};
