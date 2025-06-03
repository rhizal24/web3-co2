"use client";

import { memo, useRef } from "react";
import PropTypes from "prop-types";
import { cn } from "@/lib/utils";

export const Accordion = memo(function Accordion({ isOpen = true, children, className }) {
  const contentRef = useRef(null);
  return (
    <div
      className={cn("overflow-hidden transition-all duration-500", className)}
      style={{ height: isOpen ? contentRef.current.scrollHeight : 0 }}
    >
      <div ref={contentRef} className="p-4">
        {children}
      </div>
    </div>
  );
});

Accordion.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
};
