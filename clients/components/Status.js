import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import { cn } from "@/lib/utils";

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
  // ===== STATE MANAGEMENT =====
  const [projectId, setProjectId] = useState("");

  // ===== EFFECTS =====
  useEffect(() => {
    console.log("🔍 Status component received:", { status, statusColor });
  }, [status, statusColor]);

  // ===== EVENT HANDLERS =====
  const handleInputChange = (e) => {
    const value = e.target.value;
    setProjectId(value);

    // Send value to parent component
    if (onProjectIdChange) {
      onProjectIdChange(value);
    }
  };

  const handleMintClick = () => {
    // Send project ID to parent when mint button is clicked
    if (onMintToken) {
      onMintToken(projectId);
    }
  };

  // ===== STYLE FUNCTIONS =====
  const getCircleClass = () => {
    const baseClasses = "mt-2 h-4 w-4 rounded-full";

    const colorMap = {
      green: "bg-green-400",
      brown: "bg-red-500",
      red: "bg-red-500",
      yellow: "bg-yellow-400",
      gray: "bg-white",
    };

    const colorClass = colorMap[statusColor] || colorMap.gray;
    return `${baseClasses} ${colorClass}`;
  };

  const getStatusTextClass = () => {
    return "font-eudoxus-light text-3xl";
  };

  const getStatusLabelClass = () => {
    return "font-eudoxus-bold items-center text-center text-3xl text-[#163956]";
  };

  // ===== RENDER =====
  return (
    <div className={cn("flex w-full items-center justify-between", className)} {...props}>
      {/* Status Display Section */}
      <div className="flex items-center gap-3">
        <div className={getStatusLabelClass()}>Status:</div>
        <div className={getCircleClass()}></div>
        <div className={getStatusTextClass()}>{status}</div>
      </div>

      {/* Project Input and Mint Section */}
      <div className="flex h-full w-[57.5%] items-center justify-between">
        {/* Project ID Input */}
        <div className="w-[73.5%]">
          <input
            type="text"
            value={projectId}
            onChange={handleInputChange}
            className="font-eudoxus-medium w-full rounded-[10px] border border-[#163956] bg-white/20 px-4 py-3.5 text-xl placeholder-black/30 backdrop-blur-lg focus:outline-none"
            placeholder="Enter Project ID..."
            aria-label="Project ID"
          />
        </div>

        {/* Mint Button */}
        <div>
          <button
            onClick={handleMintClick}
            className="font-eudoxus-medium cursor-pointer rounded-[8px] border-[1px] border-black bg-[#5DF590] px-6 py-3 text-2xl text-black transition-colors duration-300 hover:bg-[#42C26D] focus:ring-2 focus:ring-[#42C26D] focus:ring-offset-2 focus:outline-none"
            type="button"
            aria-label="Mint Carbon Credit Token"
          >
            Mint Token
          </button>
        </div>
      </div>
    </div>
  );
}

// ===== PROP TYPES =====
Status.propTypes = {
  children: PropTypes.node,
  className: PropTypes.string,
  token: PropTypes.string,
  status: PropTypes.string.isRequired,
  statusColor: PropTypes.oneOf(["green", "brown", "red", "yellow", "gray"]),
  onProjectIdChange: PropTypes.func,
  onMintToken: PropTypes.func,
};

// ===== DEFAULT PROPS =====
Status.defaultProps = {
  statusColor: "green",
  className: "",
};
