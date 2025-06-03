"use client";

import PropTypes from "prop-types";
import { createClient } from "@/utils/supabase/client";
import { createContext } from "react";
import Cookies from "js-cookie";

const AuthContext = createContext();

const AuthProvider = ({ children }) => {
  const supabase = createClient();
  // create a new user
  const signUp = async (name, username, password) => {
    const { data, error } = await supabase.auth.signUp({
      email: username,
      password: password,
    });

    if (error) {
      console.log("error", error);
      return error;
    }

    console.log("data", data);
    const userData = {
      userid: data.user.id,
      nama: name,
      username: username,
      password: password,
    };
    // insert data to user table
    if (data.user) {
      const { error } = await supabase.from("users").insert([userData]);
      if (error) {
        console.log("Insert error:", error.message);
      }

      const { data: usersData } = await supabase.from("users").select("*");
      console.log("response", usersData);
    }

    return { status: "success", username: username };
  };

  const signIn = async (username, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: username,
      password: password,
    });

    console.log("data", data);
    console.log("error", error);

    if (error) return { status: "error", error: error.message };
    const dataUser = {
      status: "success",
      userid: data.user.id,
      username: username,
    };

    Cookies.set("access_token", JSON.stringify(dataUser), {
      expires: 1,
      path: "/",
      secure: true,
      sameSite: "Strict",
    });

    return {
      status: "success",
      userid: data.user.id,
      username: username,
    };
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) return { status: "error", error: error.message };
    Cookies.remove("access_token");
    return { status: "success" };
  };

  const getCurrentUser = async () => {
    if (!Cookies.get("access_token")) {
      return { status: "error", error: "User not found" };
    }
    const { data, error } = await supabase.auth.getUser();
    const { data: dataUser, error: errorUser } = await supabase
      .from("users")
      .select("*")
      .eq("userid", data.user.id)
      .single();
    if (error) return { status: "error", error: error.message };
    if (!data.user) return { status: "error", error: "User not found" };
    return {
      status: "success",
      userid: data.user.id,
      username: data.user.email,
      name: dataUser.nama,
    };
  };
  return (
    <AuthContext.Provider value={{ signUp, signIn, signOut, getCurrentUser }}>
      {children}
    </AuthContext.Provider>
  );
};

AuthProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export { AuthContext, AuthProvider };
