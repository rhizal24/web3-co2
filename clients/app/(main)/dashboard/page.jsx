"use client";
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
  return (
    <>
      <div className="item-center flex h-screen w-full flex-col items-center gap-14 bg-blue-50/50">
        <div className="w-full">
          <Navbar className={"mt-10"} address={apa.address} />
        </div>
        <div className="flex w-[80%] flex-col items-center justify-center gap-11">
          <div className="flex w-full items-center justify-center gap-14">
            <TokenInfo token={apa.token} />
            <DebtInfo token={apa.token} />
          </div>
          <div className="w-[75.5%]">
            <Status status={"Green Contributor"} />
          </div>
          <div className="w-[75.5%]">
            <TransferForm
              destinationWallet={"0xabcdef1234567890abcdef1234567890abcdef12"}
              numOfTokens={apa.token}
            />
          </div>
        </div>
      </div>
    </>
  );
}
