import { Outlet } from "react-router-dom";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { NoiseOverlay } from "@/components/effects/NoiseOverlay";

export function Layout() {
  return (
    <div className="relative min-h-screen bg-luxury-onyx text-luxury-frost">
      <NoiseOverlay />
      <Header />
      <main>
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
