"use client";
import { useState } from "react";

const Status = ({
  status,
  onProjectIdChange,
  onMintToken,
  availableProjects = [],
  projectsLoading = false,
}) => {
  const [projectId, setProjectId] = useState("");
  const [showProjects, setShowProjects] = useState(false);

  const handleInputChange = (e) => {
    const value = e.target.value;
    setProjectId(value);
    onProjectIdChange(value);
  };

  const handleMintClick = () => {
    if (!projectId.trim()) {
      alert("Please enter or select a project ID!");
      return;
    }
    onMintToken(projectId);
  };

  const handleProjectSelect = (selectedProject) => {
    setProjectId(selectedProject.id);
    onProjectIdChange(selectedProject.id);
    setShowProjects(false);
  };

  return (
    <div className="rounded-lg bg-white p-6 shadow-md">
      <h3 className="mb-4 text-lg font-semibold text-gray-800">
        Status:{" "}
        <span className={status === "Green Contributor" ? "text-green-600" : "text-red-600"}>
          {status}
        </span>
      </h3>

      <div className="space-y-4">
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Carbon Offset Project ID
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Enter Project ID (e.g., proj1)"
              value={projectId}
              onChange={handleInputChange}
              className="flex-1 rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
            <button
              onClick={() => setShowProjects(!showProjects)}
              disabled={projectsLoading}
              className="rounded-md border border-gray-300 bg-gray-100 px-3 py-2 transition-colors hover:bg-gray-200 disabled:cursor-not-allowed disabled:bg-gray-300"
              title="Show available projects"
            >
              {projectsLoading ? "⏳" : "📋"}
            </button>
            <button
              onClick={handleMintClick}
              disabled={!projectId.trim()}
              className="rounded-md bg-blue-600 px-6 py-2 font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-400"
            >
              Mint CCT
            </button>
          </div>
        </div>

        {/* Available Projects Dropdown */}
        {showProjects && (
          <div className="max-h-64 overflow-hidden rounded-md border border-gray-300 bg-white shadow-lg">
            <div className="border-b bg-gray-50 p-3 text-sm font-medium text-gray-700">
              {projectsLoading ? (
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-600 border-t-transparent"></div>
                  Loading projects...
                </div>
              ) : (
                `Available Projects (${availableProjects.length})`
              )}
            </div>
            <div className="max-h-48 overflow-y-auto">
              {projectsLoading ? (
                <div className="p-4 text-center text-sm text-gray-500">
                  Loading available projects...
                </div>
              ) : availableProjects.length > 0 ? (
                availableProjects.map((project) => (
                  <div
                    key={project.id}
                    onClick={() => handleProjectSelect(project)}
                    className="cursor-pointer border-b p-3 transition-colors last:border-b-0 hover:bg-blue-50"
                  >
                    <div className="font-medium text-gray-900">{project.id}</div>
                    <div className="mt-1 text-sm text-gray-600">{project.projectName}</div>
                    <div className="mt-2 flex items-center justify-between">
                      <div className="text-xs font-medium text-green-600">
                        🌱 Offset: {project.offsetTon} ton CO₂
                      </div>
                      <div className="text-xs text-gray-500">{project.createdAt}</div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-4 text-center text-sm text-gray-500">
                  No available projects found for your company
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Status;
