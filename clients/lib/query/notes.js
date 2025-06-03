import { createClient } from "@/utils/supabase/client";
const supabase = createClient();

export const ambilNotes = async (select = "*") => {
  const { data, error } = await supabase.from("notes").select(select);
  return data;
};
