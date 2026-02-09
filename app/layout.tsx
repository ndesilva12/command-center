import type { Metadata } from "next";
import { Inter, Sacramento } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

const sacramento = Sacramento({
  variable: "--font-sacramento",
  weight: "400",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Command Center - Norman C. de Silva",
  description: "Personal command center and intelligence dashboard",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${sacramento.variable}`}>
        {children}
      </body>
    </html>
  );
}
