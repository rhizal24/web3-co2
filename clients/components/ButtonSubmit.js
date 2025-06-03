import PropTypes from "prop-types";
import { cn } from "@/lib/utils";

export default function ButtonSubmit({ children, className, ...props }) {
  return (
    <button
      type="button"
      className={cn(
        "font-eudoxus-medium rounded-[50px] bg-[#213356] text-center text-xl text-[#EFF4FE] duration-500 hover:bg-[#466EB8] max-sm:p-3 sm:p-4 sm:text-2xl lg:text-3xl",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

ButtonSubmit.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
};
