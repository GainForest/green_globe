import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "@/app/globals.css";

import { headers } from "next/headers";
import WagmiContextProvider from "./_contexts/wagmi";
import Providers from "./_components/Providers";
import { metadata as metadataConfig } from "@/config/metadata";
import { Analytics } from "@vercel/analytics/react";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = metadataConfig;

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookies = (await headers()).get("cookie");

  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased flex min-h-screen flex-col dark`}
      >
        <Analytics />
        <Providers>
          <WagmiContextProvider cookies={cookies}>
            {children}
          </WagmiContextProvider>
        </Providers>
      </body>
    </html>
  );
}
