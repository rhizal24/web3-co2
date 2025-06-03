"use client";

import { X } from "lucide-react";
import { useState, useEffect } from "react";
import { fetchAllUsersExcept } from "@/lib/query/users";
import { addDocumentContributor, removeDocumentContributor } from "@/lib/query/access";
import { createClient } from "@/utils/supabase/client";
import PropTypes from "prop-types";

export default function ContributorPopup({ onClose, ownerUserId, docId }) {
  const [selected, setSelected] = useState([]);
  const [initialSelected, setInitialSelected] = useState([]); // Track initial selections
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const supabase = createClient();

  // Fetch all users except document owner
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);

        // Fetch all users except owner
        const { data: userData, error: userError } = await fetchAllUsersExcept(ownerUserId);
        if (userError) {
          console.error("Error loading users:", userError);
          return;
        }

        // Fetch existing contributors to pre-check them
        const { data: accessData, error: accessError } = await supabase
          .from("access")
          .select("userid")
          .eq("docid", docId);

        if (accessError) {
          console.error("Error loading existing access:", accessError);
          return;
        }

        // Set users
        if (userData) {
          setUsers(userData);
        }

        // Get list of user IDs who already have access
        const existingUserIds = accessData?.map((item) => item.userid) || [];
        setSelected(existingUserIds);
        setInitialSelected(existingUserIds); // Save initial state for comparison
      } catch (err) {
        console.error("Unexpected error:", err);
      } finally {
        setLoading(false);
      }
    }

    if (docId && ownerUserId) {
      loadData();
    }
  }, [ownerUserId, docId, supabase]);

  const toggleSelect = (userId) => {
    setSelected((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId],
    );
  };

  // Handle saving changes when Done is clicked
  const handleSave = async () => {
    if (saving) return;

    try {
      setSaving(true);

      // Find newly added users (in selected but not in initialSelected)
      const usersToAdd = selected.filter((userId) => !initialSelected.includes(userId));

      // Find removed users (in initialSelected but not in selected)
      const usersToRemove = initialSelected.filter((userId) => !selected.includes(userId));

      // Add new users
      for (const userId of usersToAdd) {
        await addDocumentContributor(docId, userId);
      }

      // Remove unselected users
      for (const userId of usersToRemove) {
        await removeDocumentContributor(docId, userId);
      }

      // Successful completion
      onClose();
    } catch (err) {
      console.error("Error saving contributor changes:", err);
    } finally {
      setSaving(false);
    }
  };

  // Filter users based on search
  const filteredUsers = users.filter(
    (user) =>
      (user.nama?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
      (user.username?.toLowerCase() || "").includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center rounded-lg bg-black/40">
      <div className="relative w-[90%] max-w-md rounded-2xl bg-white p-6 shadow-lg">
        <div className="flex items-center justify-between rounded-lg border-b pb-2">
          <h2 className="font-eudoxus-bold text-xl text-[#16223B]">Tambahkan Contributor</h2>
          <button onClick={onClose} disabled={saving}>
            <X className="h-5 w-5 text-gray-700" />
          </button>
        </div>

        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="🔍 Search..."
          className="mt-3 w-full rounded-md border px-3 py-2 text-sm text-black placeholder-gray-400 focus:outline-none"
          disabled={saving}
        />

        <div className="mt-4 max-h-64 space-y-2 overflow-y-auto pr-1">
          {loading ? (
            <div className="py-2 text-center text-gray-500">Loading users...</div>
          ) : filteredUsers.length > 0 ? (
            filteredUsers.map((user) => (
              <div key={user.userid} className="flex items-center justify-between px-1 py-1">
                <span className="text-sm text-black sm:text-base">
                  {user.nama || user.username || "Unknown user"}
                </span>
                <button
                  className={`h-5 w-5 cursor-pointer rounded-sm border border-black ${saving ? "opacity-50" : ""}`}
                  onClick={() => !saving && toggleSelect(user.userid)}
                >
                  {selected.includes(user.userid) && (
                    <div className="flex h-full w-full items-center justify-center bg-blue-500">
                      <span className="text-white">✓</span>
                    </div>
                  )}
                </button>
              </div>
            ))
          ) : (
            <div className="py-2 text-center text-gray-500">No users found</div>
          )}
        </div>

        <div className="mt-4 flex justify-end">
          <button
            onClick={handleSave}
            disabled={saving}
            className="rounded border-black bg-blue-500 px-4 py-2 font-bold text-white hover:bg-[#0090dd] disabled:opacity-50"
          >
            {saving ? "Saving..." : "Done"}
          </button>
        </div>
      </div>
    </div>
  );
}

ContributorPopup.propTypes = {
  onClose: PropTypes.func.isRequired,
  ownerUserId: PropTypes.string.isRequired,
  docId: PropTypes.string.isRequired,
};
