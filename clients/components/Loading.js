import { cn } from "@/lib/utils";
import Image from "next/image";
import PropTypes from "prop-types";

export default function Loading({ className }) {
  return (
    <div className={cn("flex h-full w-full items-center justify-center bg-black/50", className)}>
      <Image
        alt="loading"
        src="/loading.gif"
        width={2000}
        height={2000}
        className="w-[100px]"
        unoptimized
      />
    </div>
  );
}

Loading.propTypes = {
  className: PropTypes.string,
};
