import { cn } from "@/lib/utils";
import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";

export default function Status({
  children,
  className,
  token,
  status,
  statusColor = "green",
  onProjectIdChange,
  onMintToken,
  ...props
}) {
  const [projectId, setProjectId] = useState("");

  // Debug log
  useEffect(() => {
    console.log("🔍 Status component received:", { status, statusColor });
  }, [status, statusColor]);

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

  // Function to get circle color based on statusColor
  const getCircleClass = () => {
    switch (statusColor) {
      case "green":
        return "bg-green-400"; // Green circle
      case "brown":
        return "bg-red-500"; // Red circle for Brown Emitter
      case "gray":
      default:
        return "bg-white"; // White circle for Neutral
    }
  };

  return (
    <div className="flex w-full items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="font-eudoxus-bold items-center text-center text-3xl text-[#163956]">
          Status:
        </div>
        <div className={`mt-2 h-4 w-4 rounded-full ${getCircleClass()}`}></div>
        <div className="font-eudoxus-light text-3xl">{status}</div>
      </div>
      <div className="flex h-full w-[57.5%] items-center justify-between">
        <div className="w-[73.5%]">
          <input
            type="text"
            value={projectId}
            onChange={handleInputChange}
            className="font-eudoxus-medium w-full rounded-[10px] border border-[#163956] bg-white/20 px-4 py-3.5 text-xl placeholder-black/30 backdrop-blur-lg focus:outline-none"
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
  children: PropTypes.node, // Fix typo: childeren -> children
  className: PropTypes.string,
  token: PropTypes.string,
  status: PropTypes.string.isRequired,
  statusColor: PropTypes.string, // Add statusColor prop
  onProjectIdChange: PropTypes.func,
  onMintToken: PropTypes.func,
};
