"use client";
import { createClient } from "@/utils/supabase/client";
import { useContext, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Loading from "@/components/Loading";
import ButtonHome from "@/components/ButtonHome";
import ButtonContributor from "@/components/ButtonContributor";
import AccessDropdown from "@/components/AccessDropdown";
import HeaderDocuments from "@/components/HeaderDocuments";
import ButtonSave from "@/components/ButtonSave";
import { fetchDocumentById, updateDocument } from "@/lib/query/documents";
import { fetchUserById } from "@/lib/query/users";
import ContributorPopup from "@/components/ContributorPopup";
import { AuthContext } from "@/components/AuthProvider";
import { fetchDocumentContributors } from "@/lib/query/access";

export default function Home() {
  const supabase = createClient();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [document, setDocument] = useState(null);
  const [documentContent, setDocumentContent] = useState("");
  const [documentTitle, setDocumentTitle] = useState("");
  const [documentDate, setDocumentDate] = useState("");
  const [documentEditDate, setDocumentEditDate] = useState("");
  const [editMode, setEditMode] = useState("Edit");
  const [ownerName, setOwnerName] = useState("");
  const [currentUser, setCurrentUser] = useState(null);
  const [isOwner, setIsOwner] = useState(false);
  const [hasAccess, setHasAccess] = useState(false);
  const [contributors, setContributors] = useState([]);
  const [accessChecked, setAccessChecked] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [originalContent, setOriginalContent] = useState("");
  const searchParams = useSearchParams();
  const { getCurrentUser } = useContext(AuthContext);

  useEffect(() => {
    async function loadCurrentUser() {
      try {
        const userData = await getCurrentUser();
        if (userData.status === "success") {
          setCurrentUser(userData);

          if (document && document.ownerid) {
            const isDocOwner = userData.userid === document.ownerid;
            setIsOwner(isDocOwner);

            if (isDocOwner) {
              setHasAccess(true);
              setAccessChecked(true);
            }
          }
        }
      } catch (err) {
        console.error("Error fetching current user:", err);
      }
    }

    loadCurrentUser();
  }, [getCurrentUser, document]);

  useEffect(() => {
    async function checkAccess() {
      if (!document || !currentUser) return;

      if (isOwner) {
        return;
      }

      try {
        const { data, error } = await supabase
          .from("access")
          .select()
          .eq("docid", document.docid)
          .eq("userid", currentUser.userid)
          .single();

        if (error && error.code !== "PGRST116") {
          console.error("Error checking access:", error);
        }

        const userHasAccess = !!data;
        setHasAccess(userHasAccess);
        setAccessChecked(true);

        // Redirect to 404 if no access
        if (!userHasAccess && !isOwner) {
          router.push("/not-found");
        }
      } catch (err) {
        console.error("Unexpected error checking access:", err);
        setAccessChecked(true);
      }
    }

    checkAccess();
  }, [document, currentUser, isOwner, router]);

  // Fetch document owner when document loads
  useEffect(() => {
    async function fetchDocumentOwner() {
      if (!document || !document.ownerid) return;

      // Check if current user is owner when document loads
      if (currentUser) {
        const isDocOwner = currentUser.userid === document.ownerid;
        setIsOwner(isDocOwner);

        // If user is owner, they have access
        if (isDocOwner) {
          setHasAccess(true);
          setAccessChecked(true);
        }
      }

      try {
        const { data, error } = await fetchUserById(document.ownerid);
        if (error) {
          console.error("Error fetching document owner:", error);
          return;
        }

        if (data) {
          setOwnerName(data.nama || "Unknown");
        }
      } catch (err) {
        console.error("Unexpected error fetching owner:", err);
      }
    }

    fetchDocumentOwner();
  }, [document, currentUser]);

  // Fetch document
  useEffect(() => {
    async function fetchDocument() {
      try {
        const docId = searchParams.get("id");

        if (docId) {
          const { data, error } = await fetchDocumentById(docId);

          if (error) {
            console.error("Error fetching document:", error);
            router.push("/not-found"); // Redirect to 404 if document not found
          } else if (data) {
            setDocument(data);
            setDocumentTitle(data.judul || "Untitled Document");

            // Format dates to include both date and time
            const dateTimeOptions = {
              year: "numeric",
              month: "numeric",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            };

            // Set creation date with time
            setDocumentDate(new Date(data.createtime).toLocaleString("id-ID", dateTimeOptions));

            // Set edit date with time if it exists
            setDocumentEditDate(
              data.edittime ? new Date(data.edittime).toLocaleString("id-ID", dateTimeOptions) : "",
            );

            // Store original content to track changes
            const content = data.isi;
            setDocumentContent(content);
            setOriginalContent(content);
            setHasChanges(false);

            // If we already have current user data, check if user is owner
            if (currentUser) {
              const isDocOwner = currentUser.userid === data.ownerid;
              setIsOwner(isDocOwner);

              if (isDocOwner) {
                setHasAccess(true);
                setAccessChecked(true);
              }
            }
          }
        }
      } catch (err) {
        console.error("Unexpected error:", err);
        router.push("/not-found"); // Redirect to 404 on any error
      } finally {
        setLoading(false);
      }
    }

    fetchDocument();
  }, []);

  // Add this function to your component outside useEffect, before the return statement
  const fetchContributors = async (docId, ownerId) => {
    if (!docId || !ownerId) return;

    try {
      const { data, error } = await fetchDocumentContributors(docId, ownerId);
      if (error) {
        console.error("Error fetching contributors:", error);
        return;
      }

      if (data) {
        setContributors(data);
      }
    } catch (err) {
      console.error("Unexpected error fetching contributors:", err);
    }
  };

  // Then update your useEffect to use this function
  useEffect(() => {
    if (document?.docid && document?.ownerid) {
      fetchContributors(document.docid, document.ownerid);
    }
  }, [document]);

  // Update the handleContentChange function to check for changes
  const handleContentChange = (e) => {
    const newContent = e.target.value;
    setDocumentContent(newContent);
    // Set hasChanges if content is different from original
    setHasChanges(newContent !== originalContent);
  };

  // Update the handleSave function to save changes to the database
  const handleSave = async () => {
    if (!hasChanges || isSaving) return;

    try {
      setIsSaving(true);

      // Update document in the database
      const { data, error } = await updateDocument(document.docid, {
        isi: documentContent,
      });

      if (error) {
        console.error("Error saving document:", error);
        return;
      }

      // Document saved successfully
      if (data) {
        console.log("Document saved successfully!");

        setTimeout(() => {
          window.location.reload();
        }, 200);
      }
    } catch (err) {
      console.error("Unexpected error saving document:", err);
      setIsSaving(false);
    }
  };

  // Show loading if still loading OR if access check is not complete yet
  if (loading || !accessChecked) return <Loading />;

  // Redirect if no access - this is a fallback in case the useEffect redirect fails
  if (!hasAccess && accessChecked) {
    router.push("/not-found");
    return <Loading />;
  }

  return (
    <>
      <div className="relative flex h-full w-full flex-col items-center justify-center pt-10 text-black">
        <div className="relative flex h-[85%] w-[90%] flex-col text-[white]">
          {/* atas */}
          <div className="relative flex h-[7%] w-full items-center justify-between text-[white]">
            {/* home */}
            <div className="w-[50%]">
              <ButtonHome />
            </div>
            {/* access */}
            <div className="flex h-full w-[50%] flex-row items-center justify-end gap-4 text-[white]">
              <AccessDropdown onModeChange={setEditMode} initialMode={editMode} />
              {isOwner && (
                <ButtonContributor onClick={() => setOpen(true)}>Contributor</ButtonContributor>
              )}
            </div>
          </div>

          {/* bawah */}
          <div className="relative flex h-[88%] w-full flex-col gap-[12px] rounded-[10px] border-[1.5px] border-[#16223B] bg-white/40 px-3 py-3 text-[white] backdrop-blur-lg">
            {/* Judul dkk */}
            <div className="flex h-[18%] w-full">
              <HeaderDocuments
                title={documentTitle}
                createdAt={documentDate}
                editedAt={documentEditDate}
                username={ownerName || "Unknown Owner"}
                contributors={contributors}
                className="w-full"
              />
            </div>

            {/* Divider between header and content - adjusted to match content padding AND scrollbar */}
            <div className="w-full px-6 pr-3">
              <div className="w-full border-b border-[#16223B]/30" />
            </div>

            {/* Isi */}
            <div className="scrollbar-thin scrollbar-thumb-[#16223B]/70 scrollbar-track-[#16223B]/20 scrollbar-thumb-rounded-full scrollbar-track-rounded-full flex h-[82%] w-full flex-col items-start gap-6 overflow-y-auto px-6 py-4 pr-3 text-[black]">
              {editMode === "Edit" ? (
                <textarea
                  value={documentContent}
                  onChange={handleContentChange}
                  className="font-eudoxus-sans h-full w-full resize-none rounded-md border border-[#16223B]/20 bg-transparent p-3 text-justify focus:border-[#16223B]/40 focus:outline-none"
                />
              ) : (
                <div className="font-eudoxus-sans h-full w-full rounded-md border border-[#16223B]/20 bg-transparent p-3 text-justify whitespace-pre-wrap">
                  {documentContent}
                </div>
              )}
            </div>
          </div>
          {/* save - only show in Edit mode */}
          <div className="flex h-[5%] w-full flex-row justify-end pt-1">
            {editMode === "Edit" && (
              <ButtonSave
                onClick={handleSave}
                disabled={!hasChanges || isSaving}
                className={!hasChanges ? "cursor-not-allowed opacity-50" : ""}
              >
                {isSaving ? "Saving..." : "Save"}
              </ButtonSave>
            )}
          </div>
        </div>
      </div>
      {open && document?.ownerid && (
        <ContributorPopup
          onClose={() => {
            setOpen(false);
            // Refresh contributors list after popup closes
            if (document?.docid && document?.ownerid) {
              fetchContributors(document.docid, document.ownerid);
            }
          }}
          ownerUserId={document.ownerid}
          docId={document.docid}
        />
      )}
    </>
  );
}
