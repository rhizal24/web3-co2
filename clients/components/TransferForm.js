import { cn } from "@/lib/utils";
import React from "react";
import PropTypes from "prop-types";
import { Input } from "postcss";

export default function TransferForm({
  childeren,
  className,
  destinationWallet,
  numOfTokens,
  ...props
}) {
  return (
    <div className="flex w-full flex-col items-center justify-between gap-8 rounded-[15px] border-[1.5px] border-[#564521] bg-[#2F7AB9]/50 px-11 py-10 backdrop-blur-lg">
      <div className="font-eudoxus-bold mb-4 w-full text-start text-6xl">Transfer Form</div>
      <div className="flex w-full flex-col gap-6">
        <div className="flex flex-col gap-2">
          <div className="font-eudoxus-medium text-4xl text-[#163956]">Destination Wallet:</div>
          <input
            type="text"
            className="font-eudoxus-medium mt-2 w-full rounded-[6px] border border-[#163956] bg-white/45 px-4 py-4 text-xl placeholder-black/30 focus:outline-none"
            placeholder="Enter destination wallet address you want to transfer..."
          />
        </div>
        <div className="flex flex-col gap-2">
          <div className="font-eudoxus-medium text-4xl text-[#163956]">Number Of Token:</div>
          <input
            type="text"
            className="font-eudoxus-medium mt-2 w-full rounded-[6px] border border-[#163956] bg-white/45 px-4 py-4 text-xl placeholder-black/30 focus:outline-none"
            placeholder="Enter the number of tokens you want to transfer..."
          />
        </div>
        <div className="mb-1 flex w-full items-end justify-end">
          <button
            className="font-eudoxus-medium cursor-pointer rounded-[8px] border-[1px] border-black bg-[#5DF590] px-6 py-3 text-2xl text-black transition-colors duration-300 hover:bg-[#42C26D]"
            type="button"
          >
            Transfer
          </button>
        </div>
      </div>
    </div>
  );
}

TransferForm.propTypes = {
  childeren: PropTypes.node.isRequired,
  className: PropTypes.string,
  numOfTokens: PropTypes.string.isRequired,
  destinationWallet: PropTypes.string.isRequired,
};
