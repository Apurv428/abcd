import Sidebar from "@/components/ui/Sidebar";
import Disclaimer from "@/components/ui/Disclaimer";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <Sidebar />
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          marginLeft: "240px",
        }}
      >
        <main style={{ flex: 1, padding: "24px 32px", overflowY: "auto" }}>
          {children}
        </main>
        <div style={{ padding: "8px 32px 16px" }}>
          <Disclaimer />
        </div>
      </div>

      {/* Mobile layout adjustments via CSS */}
      <style>{`
        @media (max-width: 768px) {
          div[style*="margin-left: 240px"] {
            margin-left: 0 !important;
            padding-top: 60px;
          }
          main[style*="padding: 24px 32px"] {
            padding: 16px !important;
          }
          div[style*="padding: 8px 32px 16px"] {
            padding: 8px 16px 16px !important;
          }
        }
      `}</style>
    </div>
  );
}
