"use client";

import { cn } from "@/lib/utils";
import PropTypes from "prop-types";

export default function DefaultLayout({ children, className }) {
  return (
    <>
      <div className="absolute z-[10] h-full w-full bg-[#E7EFFE] opacity-50" />
      <div className={cn("relative z-[15] h-full w-full", className)}>{children}</div>
    </>
  );
}

DefaultLayout.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
};
