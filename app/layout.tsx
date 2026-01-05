import "./globals.css";
import Header from "@/app/components/header";
import { Providers } from "@/app/providers";
import { DM_Sans, Libre_Baskerville } from "next/font/google";

const bodyFont = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-body",
  display: "swap",
});

const headingFont = Libre_Baskerville({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-heading",
  display: "swap",
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body
        className={`${bodyFont.variable} ${headingFont.variable} antialiased`}
      >
        <Providers>
          <Header />
          <main >{children}</main>
        </Providers>
      </body>
    </html>
  );
}
