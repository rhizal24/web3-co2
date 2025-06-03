import { cn } from "@/lib/utils";
import PropTypes from "prop-types";
import { Search } from "lucide-react";

export default function SearchBox({ className, value, onChange, ...props }) {
  return (
    <div
      className={cn(
        "flex w-[35%] items-center gap-[4px] rounded-[8px] border-[1.5px] border-[#16223B]/20 bg-[#505050]/20 px-1.5 py-1 backdrop-blur-xl duration-300 ease-in-out hover:shadow-lg md:w-[40%] md:px-3 md:py-2 xl:w-[30%] 2xl:w-[20%]",
        className,
      )}
    >
      <Search className="mr-1 h-3 w-3 text-[#16223B]/50 duration-300 ease-in-out md:h-4.5 md:w-4.5" />
      <input
        type="text"
        placeholder="Search documents..."
        className="font-eudoxus-medium md:text-md w-full rounded-[5px] text-[12px] text-[#16223B] placeholder-[#16223B]/50 duration-300 ease-in-out focus:outline-none lg:text-lg xl:text-xl"
        value={value}
        onChange={onChange}
        {...props}
      />
    </div>
  );
}

SearchBox.propTypes = {
  className: PropTypes.string,
  value: PropTypes.string,
  onChange: PropTypes.func,
};
