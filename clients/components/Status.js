import { cn } from "@/lib/utils";
import React from "react";
import PropTypes from "prop-types";

export default function Status({ childeren, className, token, status, ...props }) {
  return (
    <div className="flex w-full items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="font-eudoxus-bold items-center text-center text-4xl text-[#163956]">
          Status:
        </div>
        <div className="mt-2 h-4 w-4 rounded-full bg-green-400"></div>
        <div className="font-eudoxus-light text-4xl">{status}</div>
      </div>
      <button className="text-black px-6 py-3 bg-[#5DF590] font-eudoxus-medium text-2xl border-[1px] border-black rounded-[8px] cursor-pointer transition-colors duration-300 hover:bg-[#42C26D]" type="button">
        Mint Token
      </button>
    </div>
  );
}

Status.propTypes = {
  childeren: PropTypes.node.isRequired,
  className: PropTypes.string,
  token: PropTypes.string.isRequired,
  status: PropTypes.string.isRequired,
};
