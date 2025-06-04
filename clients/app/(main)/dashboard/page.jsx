"use client";
import { useState } from "react";
import Navbar from "@/components/Navbar";
import TokenInfo from "@/components/TokenInfo";
import DebtInfo from "@/components/DebtInfo";
import Status from "@/components/Status";
import TransferForm from "@/components/TransferForm";

const apa = {
  address: "0x1234567890abcdef1234567890abcdef12345678",
  token: "100",
};

export default function Home() {
  const [projectId, setProjectId] = useState("");
  const [transferData, setTransferData] = useState({
    destinationWallet: "",
    numOfTokens: ""
  });

  // Function untuk handle perubahan project ID
  const handleProjectIdChange = (newProjectId) => {
    setProjectId(newProjectId);
    console.log("Project ID changed:", newProjectId);
  };

  // Function untuk handle mint token
  const handleMintToken = (projectIdValue) => {
    console.log("Mint token for project:", projectIdValue);
    alert(`Minting token for project: ${projectIdValue}`);
  };

  // Function untuk handle perubahan destination wallet
  const handleDestinationWalletChange = (wallet) => {
    setTransferData(prev => ({
      ...prev,
      destinationWallet: wallet
    }));
    console.log("Destination wallet changed:", wallet);
  };

  // Function untuk handle perubahan number of tokens
  const handleTokenAmountChange = (amount) => {
    setTransferData(prev => ({
      ...prev,
      numOfTokens: amount
    }));
    console.log("Token amount changed:", amount);
  };

  // Function untuk handle transfer
  const handleTransfer = (transferDetails) => {
    console.log("Transfer initiated:", transferDetails);
    alert(`Transferring ${transferDetails.numOfTokens} tokens to ${transferDetails.destinationWallet}`);
  };

  return (
    <>
      <div className="item-center flex h-screen w-full flex-col items-center gap-6 bg-blue-50/50">
        <div className="w-full">
          <Navbar className={"mt-5"} address={apa.address} />
        </div>
        <div className="flex w-[80%] flex-col items-center justify-center gap-6">
          <div className="flex w-full items-center justify-center gap-6">
            <TokenInfo token={apa.token} />
            <DebtInfo token={apa.token} />
          </div>
          <div className="w-[74%]">
            <Status
              status={"Green Contributor"}
              onProjectIdChange={handleProjectIdChange}
              onMintToken={handleMintToken}
            />
          </div>
          <div className="w-[74%]">
            <TransferForm
              destinationWallet={"0xabcdef1234567890abcdef1234567890abcdef12"}
              numOfTokens={apa.token}
              onDestinationWalletChange={handleDestinationWalletChange}
              onTokenAmountChange={handleTokenAmountChange}
              onTransfer={handleTransfer}
            />
          </div>
        </div>
      </div>
    </>
  );
}
