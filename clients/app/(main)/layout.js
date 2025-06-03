"use client";
import PropTypes from "prop-types";

export default function Layout({ children }) {
  return (
    <>
      <main className="relative h-screen w-full bg-[url('/bg-comp.webp')] bg-cover">
        {children}
      </main>
    </>
  );
}

Layout.propTypes = {
  children: PropTypes.node.isRequired,
};
