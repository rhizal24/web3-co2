"use client";
import { useState, useEffect } from "react";
import { ethers } from "ethers";
import { checkTransferEligibility, estimateTransferGas } from "@/utils/backend";

export default function TransferForm({
  destinationWallet,
  numOfTokens,
  onDestinationWalletChange,
  onTokenAmountChange,
  onTransfer,
  currentUserAddress,
  currentBalance,
}) {
  const [transferEligibility, setTransferEligibility] = useState(null);
  const [gasEstimate, setGasEstimate] = useState(null);
  const [validationErrors, setValidationErrors] = useState({});
  const [isValidating, setIsValidating] = useState(false);

  // Check transfer eligibility when component mounts
  useEffect(() => {
    if (currentUserAddress) {
      checkEligibility();
    }
  }, [currentUserAddress]);

  // Validate inputs when they change
  useEffect(() => {
    validateInputs();
  }, [destinationWallet, numOfTokens]);

  // Estimate gas when inputs are valid
  useEffect(() => {
    if (destinationWallet && numOfTokens && !validationErrors.address && !validationErrors.amount) {
      estimateGas();
    }
  }, [destinationWallet, numOfTokens, validationErrors]);

  const checkEligibility = async () => {
    if (!currentUserAddress) return;

    try {
      const eligibility = await checkTransferEligibility(currentUserAddress);
      setTransferEligibility(eligibility);
    } catch (error) {
      console.error("Error checking eligibility:", error);
    }
  };

  const validateInputs = () => {
    const errors = {};

    // Validate destination address
    if (destinationWallet) {
      if (!ethers.isAddress(destinationWallet)) {
        errors.address = "Invalid Ethereum address";
      } else if (destinationWallet.toLowerCase() === currentUserAddress?.toLowerCase()) {
        errors.address = "Cannot transfer to yourself";
      }
    }

    // Validate amount
    if (numOfTokens) {
      const amount = parseFloat(numOfTokens);
      if (isNaN(amount) || amount <= 0) {
        errors.amount = "Amount must be a positive number";
      } else if (currentBalance && amount > parseFloat(currentBalance)) {
        errors.amount = `Insufficient balance. You have ${currentBalance} CCT`;
      }
    }

    setValidationErrors(errors);
  };

  const estimateGas = async () => {
    if (!destinationWallet || !numOfTokens) return;

    try {
      setIsValidating(true);
      const estimate = await estimateTransferGas(destinationWallet, numOfTokens);
      setGasEstimate(estimate);
    } catch (error) {
      console.error("Error estimating gas:", error);
      setGasEstimate(null);
    } finally {
      setIsValidating(false);
    }
  };

  const handleTransfer = () => {
    // Final validation
    if (Object.keys(validationErrors).length > 0) {
      alert("Please fix the validation errors before transferring");
      return;
    }

    if (!transferEligibility?.canTransfer) {
      alert("You are not eligible to transfer tokens");
      return;
    }

    onTransfer({
      destinationWallet,
      numOfTokens,
    });
  };

  return (
    <div className="w-full rounded-lg bg-white p-6 shadow-lg">
      <h2 className="mb-6 text-xl font-semibold text-gray-800">Transfer CCT Tokens</h2>

      {/* Transfer Eligibility Status */}
      {transferEligibility && (
        <div
          className={`mb-4 rounded-lg p-3 ${
            transferEligibility.canTransfer
              ? "border border-green-200 bg-green-50"
              : "border border-red-200 bg-red-50"
          }`}
        >
          <div className="flex items-center space-x-2">
            <span
              className={`text-sm font-medium ${
                transferEligibility.canTransfer ? "text-green-800" : "text-red-800"
              }`}
            >
              Transfer Status:
            </span>
            <span
              className={`text-sm ${
                transferEligibility.canTransfer ? "text-green-600" : "text-red-600"
              }`}
            >
              {transferEligibility.canTransfer ? "✅ Eligible" : "❌ Not Eligible"}
            </span>
          </div>

          {transferEligibility.hasDebt && (
            <p className="mt-1 text-sm text-red-600">
              ⚠️ Outstanding carbon debt: {Math.abs(parseFloat(transferEligibility.debt))} units
            </p>
          )}

          {!transferEligibility.hasBalance && (
            <p className="mt-1 text-sm text-red-600">⚠️ No CCT tokens available for transfer</p>
          )}
        </div>
      )}

      <div className="space-y-4">
        {/* Destination Address Input */}
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Destination Wallet Address
          </label>
          <input
            type="text"
            value={destinationWallet}
            onChange={(e) => onDestinationWalletChange(e.target.value)}
            placeholder="0x742d35Cc6636C0532925a3b8a7C5B6Db0134C..."
            className={`w-full rounded-lg border px-3 py-2 focus:ring-2 focus:outline-none ${
              validationErrors.address
                ? "border-red-300 focus:ring-red-500"
                : "border-gray-300 focus:ring-blue-500"
            }`}
          />
          {validationErrors.address && (
            <p className="mt-1 text-sm text-red-600">{validationErrors.address}</p>
          )}
        </div>

        {/* Amount Input */}
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">Amount (CCT)</label>
          <div className="relative">
            <input
              type="number"
              value={numOfTokens}
              onChange={(e) => onTokenAmountChange(e.target.value)}
              placeholder="0.0"
              step="0.01"
              min="0"
              className={`w-full rounded-lg border px-3 py-2 focus:ring-2 focus:outline-none ${
                validationErrors.amount
                  ? "border-red-300 focus:ring-red-500"
                  : "border-gray-300 focus:ring-blue-500"
              }`}
            />
            <span className="absolute top-2 right-3 text-sm text-gray-500">CCT</span>
          </div>
          {validationErrors.amount && (
            <p className="mt-1 text-sm text-red-600">{validationErrors.amount}</p>
          )}
          {currentBalance && (
            <p className="mt-1 text-xs text-gray-500">Available balance: {currentBalance} CCT</p>
          )}
        </div>

        {/* Gas Estimate */}
        {gasEstimate && !validationErrors.address && !validationErrors.amount && (
          <div className="rounded-lg bg-blue-50 p-3">
            <p className="text-sm text-blue-800">
              <strong>Estimated Gas:</strong> {gasEstimate.gasLimit} units
            </p>
            <p className="text-sm text-blue-600">
              <strong>Estimated Cost:</strong> ~{parseFloat(gasEstimate.estimatedCost).toFixed(6)}{" "}
              ETH
            </p>
          </div>
        )}

        {isValidating && (
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-600 border-t-transparent"></div>
            <span>Validating transaction...</span>
          </div>
        )}

        {/* Transfer Button */}
        <button
          onClick={handleTransfer}
          disabled={
            !destinationWallet ||
            !numOfTokens ||
            Object.keys(validationErrors).length > 0 ||
            !transferEligibility?.canTransfer ||
            isValidating
          }
          className={`w-full rounded-lg px-4 py-3 font-medium transition-colors ${
            !destinationWallet ||
            !numOfTokens ||
            Object.keys(validationErrors).length > 0 ||
            !transferEligibility?.canTransfer ||
            isValidating
              ? "cursor-not-allowed bg-gray-300 text-gray-500"
              : "bg-blue-600 text-white hover:bg-blue-700"
          }`}
        >
          {isValidating ? "Validating..." : "Transfer CCT Tokens"}
        </button>

        {/* Help Text */}
        <div className="space-y-1 text-xs text-gray-500">
          <p>• Make sure the destination address is correct</p>
          <p>• You cannot transfer if you have outstanding carbon debt</p>
          <p>• Transaction requires ETH for gas fees</p>
        </div>
      </div>
    </div>
  );
}
