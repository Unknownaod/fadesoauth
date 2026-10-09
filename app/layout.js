import "./globals.css";

export const metadata = {
  title: "Fades Account",
  description: "Sign in with your Fades account.",
};

export const viewport = { themeColor: "#080810", colorScheme: "dark" };

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
