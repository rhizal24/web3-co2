// components/ButtonContributor.js
"use client";

import PropTypes from "prop-types";
import { useState } from "react";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import ContributorPopup from "./ContributorPopup";

export default function ButtonContributor({ children, className, ...props }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          "font-eudoxus-medium text-md flex cursor-pointer items-center gap-[8px] rounded-[10px] border border-[#16223B] bg-[#F5C45E] px-3 py-1.5 text-white duration-300 ease-in-out hover:bg-[#DDB155] sm:px-4 sm:py-2 sm:text-xl",
          className,
        )}
        {...props}
      >
        <Plus className="h-3 w-3 duration-300 ease-in-out sm:h-5 sm:w-5" strokeWidth={4} />
        {children}
      </button>
      {open && <ContributorPopup onClose={() => setOpen(false)} />}
    </>
  );
}

ButtonContributor.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
};
