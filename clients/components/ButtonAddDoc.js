import PropTypes from "prop-types";
import { cn } from "@/lib/utils";
import { Plus } from "lucide-react";
import { useRouter } from "next/router";

export default function ButtonAddDoc({ children, className, ...props }) {
  return (
    <button
      type="button"
      className={cn(
        "font-eudoxus-medium text-md flex cursor-pointer items-center gap-[8px] rounded-[5px] rounded-xl border-1 border-[#16223B] bg-[#F5C45E] px-3 py-1.5 text-white duration-300 ease-in-out hover:bg-[#DDB155] sm:px-4 sm:py-2.5 sm:text-xl",
        className,
      )}
      {...props}
    >
      <Plus className="h-3 w-3 duration-300 ease-in-out sm:h-5 sm:w-5" strokeWidth={4} />
      {children}
    </button>
  );
}

ButtonAddDoc.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
};
