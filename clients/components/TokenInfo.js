import { cn } from "@/lib/utils";
import React from "react";
import PropTypes from "prop-types";
import Image from "next/image";

export default function TokenInfo({
  children,
  className,
  token,
  tokenSymbol = "CCT",
  tokenName = "Carbon Credit Token",
  ...props
}) {
  return (
    <div className="flex w-[30%] flex-col items-start gap-9 rounded-[15px] border-[1.5px] border-[#564521] bg-[#F5C45E]/45 px-9 py-8 backdrop-blur-lg">
      <div className="font-eudoxus-bold mb-4 text-center text-5xl">Token Info</div>
      <div className="flex flex-col gap-4">
        <div className="font-eudoxus-medium text-3xl text-[#163956]">
          Current Balance {tokenSymbol} {/* Menampilkan CCT */}
        </div>
        <div className="flex items-center">
          <span className="font-eudoxus-bold text-5xl text-[#163956]">
            {token} {/* Ini adalah CCT balance */}
          </span>
          <Image
            src={"/cc.svg"}
            alt="Carbon Credit Logo"
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
  children: PropTypes.node,
  className: PropTypes.string,
  token: PropTypes.string.isRequired,
  tokenSymbol: PropTypes.string,
  tokenName: PropTypes.string,
};
