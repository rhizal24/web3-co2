import { cn } from "@/lib/utils";
import React from "react";
import PropTypes from "prop-types";
import Image from "next/image";

export default function DebtInfo({ childeren, className, token, ...props }) {
  return (
    <div className="flex w-[42.5%] flex-col items-start gap-9 rounded-[15px] border-[1.5px] border-[#564521] bg-[#F55E5E]/45 px-9 py-8 backdrop-blur-lg">
      <div className="font-eudoxus-bold mb-4 text-center text-5xl">Debt Credit Carbon</div>
      <div className="flex flex-col gap-4">
        <div className="font-eudoxus-medium text-3xl text-[#163956]">
          Your count Debt and pay off immediately!!
        </div>
        <div className="flex items-center">
          <span className="font-eudoxus-bold text-5xl text-[#F55D60]">{token}</span>
          <Image
            src={"/cc.svg"}
            alt="Logo"
            width={60}
            height={60}
            className="ml-2 inline-block h-16 w-16"
          />
        </div>
      </div>
    </div>
  );
}

DebtInfo.propTypes = {
  childeren: PropTypes.node.isRequired,
  className: PropTypes.string,
  token: PropTypes.string.isRequired,
};
