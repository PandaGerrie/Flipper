import { FlipbookViewer } from "@/components/FlipbookViewer";
import { isAllowedPdfUrl } from "@/lib/pdf-url";

type EmbedPageProps = {
  searchParams: Promise<{ url?: string }>;
};

export default async function EmbedPage({ searchParams }: EmbedPageProps) {
  const { url } = await searchParams;

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
