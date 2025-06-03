import { cn } from "@/lib/utils";
import React from "react";
import PropTypes from "prop-types";
import Image from "next/image";

export default function TokenInfo({ childeren, className, token, ...props }) {
  return (
    <div className="flex w-[30%] flex-col items-start rounded-[15px] border-[1.5px] border-[#564521] bg-[#F5C45E]/45 px-11 py-10 gap-9 backdrop-blur-lg">
      <div className="font-eudoxus-bold mb-4 text-center text-6xl">Token Info</div>
      <div className="flex flex-col gap-4">
        <div className="font-eudoxus-medium text-4xl text-[#163956]">Current Balance Token</div>
        <div className="flex ">
          <span className="font-eudoxus-bold text-6xl text-[#163956]">{token}</span>
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

TokenInfo.propTypes = {
  childeren: PropTypes.node.isRequired,
  className: PropTypes.string,
  token: PropTypes.string.isRequired,
};
