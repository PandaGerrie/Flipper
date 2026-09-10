import { headers } from "next/headers";
import { FlipbookViewer } from "@/components/FlipbookViewer";
import { authorizeEmbed } from "@/lib/embed-auth";
import { isAllowedPdfUrl } from "@/lib/pdf-url";

type EmbedPageProps = {
  searchParams: Promise<{ url?: string }>;
};

function Denied({ message }: { message: string }) {
  return (
    <div className="flex h-full items-center justify-center px-6 text-center text-[#f3eadb]">
      <div>
        <p className="font-serif text-xl">Embed not allowed</p>
        <p className="mt-2 font-sans text-sm text-[#d9cbb8]">{message}</p>
      </div>
    </div>
  );
}

export default async function EmbedPage({ searchParams }: EmbedPageProps) {
  const { url } = await searchParams;
  const headerStore = await headers();
  const referer = headerStore.get("referer");
  const host = headerStore.get("x-forwarded-host") ?? headerStore.get("host");
  const proto = headerStore.get("x-forwarded-proto") ?? "https";
  const selfOrigin = host ? `${proto}://${host}` : "http://localhost:3000";

  const auth = authorizeEmbed({ referer, selfOrigin });
  if (!auth.ok) {
    return (
      <Denied message="This website’s domain is not on the Flipper allowlist." />
    );
  }

  if (!url || !isAllowedPdfUrl(url)) {
    return (
      <div className="flex h-full items-center justify-center px-6 text-center text-[#f3eadb]">
        <div>
          <p className="font-serif text-xl">Missing PDF</p>
          <p className="mt-2 font-sans text-sm text-[#d9cbb8]">
            Add a public PDF URL to the embed placeholder’s data-src attribute.
          </p>
        </div>
      </div>
    );
  }

  return <FlipbookViewer pdfUrl={url} />;
}
