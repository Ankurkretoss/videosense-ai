import { DashboardShell } from "@/components/vantage/DashboardShell";
import { AnalysisJobProvider } from "@/components/vantage/AnalysisJobProvider";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <AnalysisJobProvider>
      <DashboardShell>{children}</DashboardShell>
    </AnalysisJobProvider>
  );
}
