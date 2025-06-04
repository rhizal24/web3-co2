import { cn } from "@/lib/utils";
import React, { useState } from "react";
import PropTypes from "prop-types";

export default function TransferForm({
  destinationWallet = "",
  numOfTokens = "",
  onDestinationWalletChange,
  onTokenAmountChange,
  onTransfer,
  ...props
}) {
  const [localDestinationWallet, setLocalDestinationWallet] = useState(destinationWallet);
  const [localNumOfTokens, setLocalNumOfTokens] = useState(numOfTokens);

  const handleWalletChange = (e) => {
    const value = e.target.value;
    setLocalDestinationWallet(value);
    // Kirim ke parent component
    if (onDestinationWalletChange) {
      onDestinationWalletChange(value);
    }
  };

  const handleTokenAmountChange = (e) => {
    const value = e.target.value;
    setLocalNumOfTokens(value);
    // Kirim ke parent component
    if (onTokenAmountChange) {
      onTokenAmountChange(value);
    }
  };

  const handleTransferClick = () => {
    const transferDetails = {
      destinationWallet: localDestinationWallet,
      numOfTokens: localNumOfTokens,
    };

    // Kirim ke parent component
    if (onTransfer) {
      onTransfer(transferDetails);
    }
  };

  return (
    <div className="flex w-full flex-col items-center justify-between gap-4 rounded-[15px] border-[1.5px] border-[#564521] bg-[#2F7AB9]/50 px-9 py-8 backdrop-blur-lg">
      <div className="font-eudoxus-bold mb-4 w-full text-start text-5xl">Transfer Form</div>
      <div className="flex w-full flex-col gap-4">
        <div className="flex flex-col gap-1">
          <div className="font-eudoxus-medium text-2xl text-[#163956]">Destination Wallet:</div>
          <input
            type="text"
            value={localDestinationWallet}
            onChange={handleWalletChange}
            className="font-eudoxus-medium mt-1 w-full rounded-[6px] border border-[#163956] bg-white/45 px-4 py-4 text-xl placeholder-black/30 focus:outline-none"
            placeholder="Enter destination wallet address you want to transfer..."
          />
        </div>
        <div className="flex flex-col gap-1">
          <div className="font-eudoxus-medium text-2xl text-[#163956]">Number Of Token:</div>
          <input
            type="number"
            value={localNumOfTokens}
            onChange={handleTokenAmountChange}
            className="font-eudoxus-medium mt-1 w-full rounded-[6px] border border-[#163956] bg-white/45 px-4 py-4 text-xl placeholder-black/30 focus:outline-none"
            placeholder="Enter the number of tokens you want to transfer..."
          />
        </div>
        <div className="mt-5 mb-1 flex w-full items-end justify-end">
          <button
            onClick={handleTransferClick}
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
  destinationWallet: PropTypes.string,
  numOfTokens: PropTypes.string,
  onDestinationWalletChange: PropTypes.func,
  onTokenAmountChange: PropTypes.func,
  onTransfer: PropTypes.func,
};
