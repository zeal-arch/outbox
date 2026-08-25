import "../styles/globals.css";
import "../styles/satoshi.css";
import "../styles/layout-utilities.css";

import AppProviders from "@/components/providers/AppProviders";

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
