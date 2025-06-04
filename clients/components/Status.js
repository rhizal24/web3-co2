import { cn } from "@/lib/utils";
import React, { useState } from "react";
import PropTypes from "prop-types";

export default function Status({
  childeren,
  className,
  token,
  status,
  onProjectIdChange,
  onMintToken,
  ...props
}) {
  const [projectId, setProjectId] = useState("");

  const handleInputChange = (e) => {
    const value = e.target.value;
    setProjectId(value);
    // Kirim value ke parent component
    if (onProjectIdChange) {
      onProjectIdChange(value);
    }
  };

  const handleMintClick = () => {
    // Kirim project ID ke parent saat mint button diklik
    if (onMintToken) {
      onMintToken(projectId);
    }
  };

  return (
    <div className="flex w-full items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="font-eudoxus-bold items-center text-center text-3xl text-[#163956]">
          Status:
        </div>
        <div className="mt-2 h-4 w-4 rounded-full bg-green-400"></div>
        <div className="font-eudoxus-light text-3xl">{status}</div>
      </div>
      <div className="flex h-full w-[57%] items-center justify-between">
        <div className="w-[70%]">
          <input
            type="text"
            value={projectId}
            onChange={handleInputChange}
            className="font-eudoxus-medium mt-2 w-full rounded-[10px] border border-[#163956] bg-white/20 px-4 py-4 text-xl placeholder-black/30 backdrop-blur-lg focus:outline-none"
            placeholder="Enter Project ID..."
          />
        </div>
        <div>
          <button
            onClick={handleMintClick}
            className="font-eudoxus-medium cursor-pointer rounded-[8px] border-[1px] border-black bg-[#5DF590] px-6 py-3 text-2xl text-black transition-colors duration-300 hover:bg-[#42C26D]"
            type="button"
          >
            Mint Token
          </button>
        </div>
      </div>
    </div>
  );
}

Status.propTypes = {
  childeren: PropTypes.node,
  className: PropTypes.string,
  token: PropTypes.string,
  status: PropTypes.string.isRequired,
  onProjectIdChange: PropTypes.func,
  onMintToken: PropTypes.func,
};
