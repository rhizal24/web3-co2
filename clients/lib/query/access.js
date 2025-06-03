import { createClient } from "@/utils/supabase/client";

/**
 * Fetch all contributors for a document, starting with the owner
 * @param {string} docid - The document ID
 * @param {string} ownerid - The owner's user ID
 * @returns {Promise<{data: Array, error: Object}>} - List of contributors
 */
export async function fetchDocumentContributors(docid, ownerid) {
  const supabase = createClient();

  try {
    // Get the owner information first
    const { data: ownerData, error: ownerError } = await supabase
      .from("users")
      .select("userid, nama, username")
      .eq("userid", ownerid)
      .single();

    if (ownerError) {
      console.error("Error fetching document owner:", ownerError);
      return { data: [], error: ownerError };
    }

    // Get other users with access to this document from the access table
    const { data: accessData, error: accessError } = await supabase
      .from("access")
      .select(
        `
        userid,
        users (
          userid,
          nama,
          username
        )
      `,
      )
      .eq("docid", docid)
      .neq("userid", ownerid); // Exclude the owner

    if (accessError) {
      console.error("Error fetching document contributors:", accessError);
      return { data: [ownerData], error: accessError };
    }

    // Format the data for the UI
    const contributorsList = [
      {
        // Add owner first with an indicator
        userid: ownerData.userid,
        name: ownerData.nama || ownerData.username || "Unknown",
        isOwner: true,
      },
      // Add other contributors
      ...accessData.map((item) => ({
        userid: item.users.userid,
        name: item.users.nama || item.users.username || "Unknown",
        isOwner: false,
      })),
    ];

    return { data: contributorsList, error: null };
  } catch (error) {
    console.error("Unexpected error fetching contributors:", error);
    return { data: [], error };
  }
}

/**
 * Add a new contributor to a document
 * @param {string} docid - The document ID
 * @param {string} userid - The user ID to add
 * @returns {Promise<{data: Object, error: Object}>}
 */
export async function addDocumentContributor(docid, userid) {
  const supabase = createClient();

  try {
    const { data, error } = await supabase
      .from("access")
      .insert([
        {
          docid: docid,
          userid: userid,
        },
      ])
      .select();

    if (error) {
      console.error("Error adding contributor:", error);
      return { data: null, error };
    }

    return { data, error: null };
  } catch (error) {
    console.error("Unexpected error adding contributor:", error);
    return { data: null, error };
  }
}

/**
 * Remove a contributor from a document
 * @param {string} docid - The document ID
 * @param {string} userid - The user ID to remove
 * @returns {Promise<{error: Object}>}
 */
export async function removeDocumentContributor(docid, userid) {
  const supabase = createClient();

  try {
    const { error } = await supabase
      .from("access")
      .delete()
      .match({ docid: docid, userid: userid });

    if (error) {
      console.error("Error removing contributor:", error);
      return { error };
    }

    return { error: null };
  } catch (error) {
    console.error("Unexpected error removing contributor:", error);
    return { error };
  }
}
