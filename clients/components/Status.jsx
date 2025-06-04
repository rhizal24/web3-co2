"use client";
import { useState, useEffect } from "react";

export default function Status({
  status,
  onProjectIdChange,
  onMintToken,
  availableProjects,
  projectsLoading,
}) {
  const [selectedProject, setSelectedProject] = useState("");
  const [manualProjectId, setManualProjectId] = useState("");
  const [useManualInput, setUseManualInput] = useState(false);

  const handleProjectChange = (projectId) => {
    setSelectedProject(projectId);
    onProjectIdChange(projectId);
  };

  const handleManualInputChange = (projectId) => {
    setManualProjectId(projectId);
    onProjectIdChange(projectId);
  };

  const handleMint = () => {
    const projectToUse = useManualInput ? manualProjectId : selectedProject;

    if (!projectToUse) {
      alert("Please select or enter a project ID!");
      return;
    }

    console.log("🎯 Minting for project:", projectToUse);
    onMintToken(projectToUse);
  };

  // Reset selections when switching input types
  useEffect(() => {
    if (useManualInput) {
      setSelectedProject("");
      onProjectIdChange(manualProjectId);
    } else {
      setManualProjectId("");
      onProjectIdChange(selectedProject);
    }
  }, [useManualInput]);

  return (
    <div className="w-full rounded-lg bg-white p-6 shadow-lg">
      <h2 className="mb-4 text-xl font-semibold text-gray-800">Project Status</h2>

      <div className="mb-6">
        <span className="text-sm font-medium text-gray-700">Current Status: </span>
        <span
          className={`rounded-full px-3 py-1 text-sm font-medium ${
            status === "Green Contributor"
              ? "bg-green-100 text-green-800"
              : "bg-gray-100 text-gray-800"
          }`}
        >
          {status}
        </span>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-800">Mint Carbon Credits</h3>

        {/* Toggle between dropdown and manual input */}
        <div className="flex items-center space-x-4">
          <label className="flex items-center">
            <input
              type="radio"
              checked={!useManualInput}
              onChange={() => setUseManualInput(false)}
              className="mr-2"
            />
            <span className="text-sm text-gray-700">Select from available projects</span>
          </label>
          <label className="flex items-center">
            <input
              type="radio"
              checked={useManualInput}
              onChange={() => setUseManualInput(true)}
              className="mr-2"
            />
            <span className="text-sm text-gray-700">Enter project ID manually</span>
          </label>
        </div>

        {!useManualInput ? (
          /* Dropdown for available projects */
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Available Projects
            </label>
            {projectsLoading ? (
              <div className="flex items-center space-x-2 py-2">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-600 border-t-transparent"></div>
                <span className="text-sm text-gray-600">Loading projects...</span>
              </div>
            ) : availableProjects && availableProjects.length > 0 ? (
              <select
                value={selectedProject}
                onChange={(e) => handleProjectChange(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                <option value="">Select a project...</option>
                {availableProjects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.id} - {project.projectName} ({project.offsetTon} tons)
                  </option>
                ))}
              </select>
            ) : (
              <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-3">
                <p className="text-sm text-yellow-800">
                  No available projects found for your wallet.
                </p>
                <p className="mt-1 text-xs text-yellow-600">
                  Make sure your wallet is registered and has unused projects.
                </p>
              </div>
            )}
          </div>
        ) : (
          /* Manual input */
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">Project ID</label>
            <input
              type="text"
              value={manualProjectId}
              onChange={(e) => handleManualInputChange(e.target.value)}
              placeholder="Enter project ID (e.g., proj1, proj2, proj3)"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
            <p className="mt-1 text-xs text-gray-500">Enter any valid project ID manually</p>
          </div>
        )}

        {/* Selected project info */}
        {!useManualInput && selectedProject && availableProjects && (
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
            {(() => {
              const project = availableProjects.find((p) => p.id === selectedProject);
              return project ? (
                <div>
                  <p className="text-sm font-medium text-blue-800">{project.projectName}</p>
                  <p className="text-xs text-blue-600">Carbon Offset: {project.offsetTon} tons</p>
                  <p className="text-xs text-blue-600">{project.description}</p>
                </div>
              ) : null;
            })()}
          </div>
        )}

        {/* Mint button */}
        <button
          onClick={handleMint}
          disabled={!selectedProject && !manualProjectId}
          className={`w-full rounded-lg px-4 py-3 font-medium transition-colors ${
            selectedProject || manualProjectId
              ? "bg-green-600 text-white hover:bg-green-700"
              : "cursor-not-allowed bg-gray-300 text-gray-500"
          }`}
        >
          {projectsLoading ? "Loading Projects..." : "Mint Carbon Credits"}
        </button>

        {/* Info text */}
        <div className="space-y-1 text-xs text-gray-500">
          <p>• Select a project to mint corresponding carbon credits</p>
          <p>• Each project can only be used once</p>
          <p>• Credits will be added to your wallet balance</p>
        </div>
      </div>
    </div>
  );
}
