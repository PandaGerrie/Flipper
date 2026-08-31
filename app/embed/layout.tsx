import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Flipbook",
  robots: { index: false, follow: false },
};

export default function EmbedLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <div className="h-dvh w-full overflow-hidden bg-[#2a211c]">{children}</div>;
}
