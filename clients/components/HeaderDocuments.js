import PropTypes from "prop-types";
import { cn } from "@/lib/utils";
import Link from "next/link";

export default function HeaderDocuments({
  title,
  createdAt,
  editedAt,
  username,
  contributors = [],
  className,
  ...props
}) {
  // Check if document has been edited (editedAt exists and is not empty)
  const isEdited = Boolean(editedAt && editedAt.trim());
  const anotherContributors = contributors.filter((contributor) => contributor.name !== username);

  return (
    <div className={cn("flex h-full w-full flex-row px-6 py-4", className)} {...props}>
      {/* Kiri: Judul dan info */}
      <div className="font-eudoxus-sans flex w-[75%] flex-col items-start justify-center">
        <h1 className="mb-1 text-3xl font-extrabold text-slate-900">{title}</h1>
        <div className="mb-1 text-slate-800">
          <span className="font-semibold">{isEdited ? "Edited at:" : "Created at:"}</span>{" "}
          <span className="text-yellow-700">{isEdited ? editedAt : createdAt}</span>
        </div>
        <div className="font-semibold text-slate-900">
          <span>By:</span>{" "}
          <Link href="#" className="text-blue-600 hover:underline">
            {username}
          </Link>
        </div>
      </div>

      {/* Kanan: Contributors */}
      <div className="font-eudoxus-sans ml-auto flex w-[25%] items-center text-sm font-semibold text-blue-600">
        <span className="whitespace-nowrap">Contributors:</span>
        <div className="ml-1 max-w-[70%] overflow-hidden text-ellipsis whitespace-nowrap">
          {anotherContributors.length > 0 ? (
            <Link
              href="#"
              className="hover:underline"
              title={anotherContributors.map((c) => c.name).join(", ")}
            >
              {" "}
              {anotherContributors.map((contributor, index) => (
                <span key={index}>
                  {index > 0 ? ", " : ""}
                  {contributor.name}
                </span>
              ))}
            </Link>
          ) : (
            <span className="text-gray-500">No contributors</span>
          )}
        </div>
      </div>
    </div>
  );
}

HeaderDocuments.propTypes = {
  title: PropTypes.string.isRequired,
  createdAt: PropTypes.string.isRequired,
  editedAt: PropTypes.string,
  username: PropTypes.string.isRequired,
  contributors: PropTypes.arrayOf(
    PropTypes.shape({
      name: PropTypes.string.isRequired,
    }),
  ),
  className: PropTypes.string,
};
