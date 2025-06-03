"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import PropTypes from "prop-types";

// Function to fetch user by ID
export async function fetchUserById(userid) {
  const supabase = createClient();

  try {
    const { data, error } = await supabase
      .from("users")
      .select("nama, username")
      .eq("userid", userid)
      .single();

    if (error) {
      console.error("Error fetching user:", error);
      return { data: null, error };
    }

    return { data, error: null };
  } catch (error) {
    console.error("Unexpected error fetching user:", error);
    return { data: null, error };
  }
}

// Function to fetch all users except one (exclude document owner)
export async function fetchAllUsersExcept(excludeUserId) {
  const supabase = createClient();

  try {
    const { data, error } = await supabase
      .from("users")
      .select("userid, nama, username")
      .neq("userid", excludeUserId);

    if (error) {
      console.error("Error fetching users:", error);
      return { data: null, error };
    }

    return { data, error: null };
  } catch (error) {
    console.error("Unexpected error fetching users:", error);
    return { data: null, error };
  }
}

export default function DocumentOwner({ ownerid }) {
  const [owner, setOwner] = useState("Unknown");
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const fetchOwnerInfo = async () => {
      if (!ownerid) {
        setLoading(false);
        return;
      }

      try {
        // Query the users table based on ownerid
        const { data, error } = await supabase
          .from("users")
          .select("nama, username")
          .eq("userid", ownerid)
          .single();

        if (error) {
          console.error("Error fetching document owner:", error);
          setLoading(false);
          return;
        }

        if (data) {
          // Prefer the full name, fallback to username
          setOwner(data.nama || data.username || "Unknown");
        }
      } catch (err) {
        console.error("Unexpected error fetching owner:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchOwnerInfo();
  }, [ownerid]);

  if (loading) return <span className="text-gray-400">Loading owner...</span>;
  return <>{owner}</>;
}

DocumentOwner.propTypes = {
  ownerid: PropTypes.string.isRequired,
};
