"use client";

import { useCallback, useContext, useEffect, useState } from "react";
import { User } from "lucide-react";
import Loading from "@/components/Loading";
import PropTypes from "prop-types";
import { AuthContext } from "@/components/AuthProvider";
import { useRouter } from "next/navigation";

const days = {
  0: "Minggu",
  1: "Senin",
  2: "Selasa",
  3: "Rabu",
  4: "Kamis",
  5: "Jumat",
  6: "Sabtu",
};

export default function Layout({ children }) {
  const [loading, setLoading] = useState(true);
  const [currDate, setCurrDate] = useState(new Date());
  const { signOut, getCurrentUser } = useContext(AuthContext);
  const [user, setUser] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const init = async () => {
      const userData = await getCurrentUser();
      if (userData) {
        setUser(userData.name);
      }
      setLoading(false);
    };
    init();
  }, []);

  useEffect(() => {
    const interval = setInterval(
      () => {
        setCurrDate(new Date());
      },
      1000 * 60 * 60 * 24,
    ); // Update every hour

    return () => clearInterval(interval);
  }, []);

  const handleLogOut = useCallback(async () => {
    // Handle logout logic here
    await signOut();
    router.refresh();
    router.push("/sign-in");
  }, []);

  //   Compute Date
  const utc7Offset = 7 * 60; // 7 hours in minutes
  const utc7Time = new Date(
    currDate.getTime() + (utc7Offset - currDate.getTimezoneOffset()) * 60000,
  );
  const day = utc7Time.getDay();

  return (
    <>
      <main className="relative h-screen w-full bg-[url('/bg-comp.webp')] bg-cover">
        {loading ? (
          <Loading className="fixed h-screen w-full" />
        ) : (
          <div className="font-eudoxus-medium fixed top-0 z-[88] flex w-full justify-between bg-[#213356] p-3 text-sm text-white md:p-4 md:text-lg">
            <div className="flex items-center">
              <User className="mr-2 h-9 w-7" />
              <span>{user}</span>
            </div>
            <div className="flex items-center gap-2 md:gap-4">
              <div className="rounded-[7px] bg-[#5D93F5] px-2 py-1">
                <span className="max-md:hidden">{`${days[day]}: `}</span>
                <span>{`${utc7Time.getDate()}-${utc7Time.getMonth() + 1}-${utc7Time.getFullYear()}`}</span>
              </div>
              <button
                type="button"
                onClick={handleLogOut}
                className="rounded-[7px] bg-[#F5C45E] px-2 py-1 duration-500 hover:bg-[#B89347]"
              >
                Log Out
              </button>
            </div>
          </div>
        )}

        {children}
      </main>
    </>
  );
}

Layout.propTypes = {
  children: PropTypes.node.isRequired,
};
