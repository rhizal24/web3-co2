import localFont from "next/font/local";

export const EudoxusBold = localFont({
  src: "./fonts/EudoxusSans-Bold.woff2",
  display: "swap",
  variable: "--font-eudoxus-bold",
});

export const EudoxusExtraBold = localFont({
  src: "./fonts/EudoxusSans-ExtraBold.woff2",
  display: "swap",
  variable: "--font-eudoxus-extrabold",
});

export const EudoxusLight = localFont({
  src: "./fonts/EudoxusSans-Light.woff2",
  display: "swap",
  variable: "--font-eudoxus-light",
});

export const EudoxusRegular = localFont({
  src: "./fonts/EudoxusSans-Regular.woff2",
  display: "swap",
  variable: "--font-eudoxus-regular",
});

export const EudoxusMedium = localFont({
  src: "./fonts/EudoxusSans-Medium.woff2",
  display: "swap",
  variable: "--font-eudoxus-medium",
});

export const fontVariables = [
  EudoxusRegular.variable,
  EudoxusBold.variable,
  EudoxusExtraBold.variable,
  EudoxusLight.variable,
  EudoxusMedium.variable,
].join(" ");
