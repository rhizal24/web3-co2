"use client";

import PropTypes from "prop-types";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Home } from "lucide-react";

export default function ButtonHome({ children, className, ...props }) {
  const router = useRouter();

  const handleClick = () => {
    router.push("/dashboard");
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className={cn(
        "font-eudoxus-medium text-md flex cursor-pointer items-center gap-[8px] rounded-[5px] rounded-xl border-1 border-[#16223B] bg-[#F5C45E] px-3 py-1.5 text-white duration-300 ease-in-out hover:bg-[#DDB155] sm:px-4 sm:py-2.5 sm:text-xl",
        className,
      )}
      {...props}
    >
      <Home className="h-3 w-3 duration-300 ease-in-out sm:h-5 sm:w-5" strokeWidth={4} />
      <span className="max-md:text-sm">Back</span>
    </button>
  );
}

ButtonHome.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
};
