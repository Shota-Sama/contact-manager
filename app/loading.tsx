import Spinner from "@/components/Spinner";

export default function Loading() {
  return (
    <div className="app-shell flex flex-1 flex-col items-center justify-center gap-4">
      <Spinner className="spinner-lg" label="Loading page" />
      <p className="subtle-copy text-sm">Loading...</p>
    </div>
  );
}
