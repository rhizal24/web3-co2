import { cn } from "@/lib/utils";
import React from "react";
import PropTypes from "prop-types";
import Image from "next/image";

export default function Navbar({
  childeren,
  className,
  address,
  isConnected,
  onConnectWallet,
  ...props
}) {
  const formatAddress = (addr) => {
    if (!addr) return "Not Connected";
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  return (
    <div className="flex w-full items-center justify-center">
      <div
        className={cn(
          "flex h-full w-[85%] items-center justify-between rounded-[15px] border-[1px] border-[#163956] bg-[#5484DD] px-2 py-2 shadow-lg backdrop-blur-md",
          className,
        )}
        {...props}
      >
        <div className="flex items-center justify-center gap-4">
          <div className="ml-3">
            <Image src={"/cc.svg"} alt="Logo" width={50} height={50} className="h-12 w-12" />
          </div>
          <div className="flex flex-row gap-2 text-[22px]">
            <div className="font-eudoxus-bold text-[#213356]">Wallet Address:</div>
            <div className="font-eudoxus-light text-white underline">
              {isConnected ? formatAddress(address) : "Not Connected"}
            </div>
          </div>
        </div>
        <button
          onClick={onConnectWallet}
          className="font-eudoxus-medium cursor-pointer rounded-[10px] border-[0.5px] border-[#163956] bg-white px-5 py-4 text-xl transition-colors duration-300 hover:bg-blue-200"
          type="button"
        >
          {isConnected ? "Connected" : "Connect Wallet"}
        </button>
      </div>
    </div>
  );
}

Navbar.propTypes = {
  childeren: PropTypes.node,
  className: PropTypes.string,
  address: PropTypes.string,
  isConnected: PropTypes.bool,
  onConnectWallet: PropTypes.func,
};
