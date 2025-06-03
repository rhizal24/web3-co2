import {
  EudoxusBold,
  EudoxusExtraBold,
  EudoxusLight,
  EudoxusMedium,
  EudoxusRegular,
  fontVariables,
} from "@/utils/font";
import React, { Suspense } from "react";
import "./globals.css";
import { cn } from "@/lib/utils";
import { AuthProvider } from "@/components/AuthProvider";
import PropTypes from "prop-types";
import Loading from "@/components/Loading";

export const metadata = {
  title: "TBD Supabase",
  description: "TBD Supabase - A simple Document management system using Supabase",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <body className={fontVariables}>
        <Suspense
          fallback={
            <Loading className={"fixed h-screen w-screen bg-[url('/bg-comp.webp')] bg-cover"} />
          }
        >
          <AuthProvider>{children}</AuthProvider>
        </Suspense>
      </body>
    </html>
  );
}

RootLayout.propTypes = {
  children: PropTypes.node.isRequired,
};
