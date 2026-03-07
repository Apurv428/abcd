import Sidebar from "@/components/ui/Sidebar";
import Header from "@/components/ui/Header";
import Disclaimer from "@/components/ui/Disclaimer";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    return (
        <div style={{ display: "flex", minHeight: "100vh" }}>
            <Sidebar />
            <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
                <Header />
                <main style={{ flex: 1, padding: "24px 32px", overflowY: "auto" }}>
                    {children}
                </main>
                <div style={{ padding: "8px 32px 16px" }}>
                    <Disclaimer />
                </div>
            </div>
        </div>
    );
}
