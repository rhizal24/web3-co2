import PropTypes from "prop-types";
import { cn } from "@/lib/utils";
import { useRouter } from "next/router";

export default function ButtonSave({ children, className, ...props }) {
  return (
    <button
      type="button"
      className={cn(
        "font-eudoxus-medium text-md flex cursor-pointer items-center justify-center rounded-[10px] border-1 border-[#16223B] bg-blue-500 px-3 py-1.5 text-white duration-300 ease-in-out hover:bg-blue-300 sm:px-4 sm:py-2.5 sm:text-xl",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

ButtonSave.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
};
