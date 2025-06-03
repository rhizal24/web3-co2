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
import PropTypes from "prop-types";

export const metadata = {
  title: "Carbon Credit",
  description: "Carbon Credit Dapp",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <body className={fontVariables}>
        <Suspense>{children}</Suspense>
      </body>
    </html>
  );
}

RootLayout.propTypes = {
  children: PropTypes.node.isRequired,
};
