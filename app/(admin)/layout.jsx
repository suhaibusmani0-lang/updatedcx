import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSideBar } from "@/components/admin/AppSideBar";
import TopBar from "@/components/admin/TopBar";

export default function AdminDashboardLayout({ children }) {
  return (
    <SidebarProvider>
      <AppSideBar />
      <SidebarInset className="min-w-0 bg-[#f7f7f5] dark:bg-gray-950">
        <div className="flex min-h-screen flex-col">
          <TopBar />
          <main className="flex-1 overflow-x-auto px-3 py-4 sm:px-5 sm:py-5 lg:px-7 lg:py-7">
            <div className="mx-auto w-full max-w-[1600px]">
              {children}
            </div>
          </main>
          <footer className="border-t bg-white/80 backdrop-blur dark:bg-gray-900/80 px-4 py-3 sm:px-6 lg:px-8">
            <div className="flex flex-col items-center justify-between gap-2 text-center sm:flex-row">
              <p className="text-xs sm:text-sm text-muted-foreground">
                © {new Date().getFullYear()} CX Admin Panel. All rights reserved.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-3 text-xs sm:text-sm">
                <a href="/privacy" className="hover:underline">Privacy Policy</a>
                <a href="/terms" className="hover:underline">Terms</a>
                <a href="/support" className="hover:underline">Support</a>
              </div>
            </div>
          </footer>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
