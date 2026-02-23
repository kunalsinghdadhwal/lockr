import { Loader2 } from "lucide-react";

export default function DashboardLoading() {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black">
      <Loader2 className="h-5 w-5 animate-spin text-zinc-600" />
    </div>
  );
}
