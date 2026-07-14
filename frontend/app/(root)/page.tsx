import Navbar from "@/components/landing/navbar";
import MainSection from "@/components/landing/mainSection";
import Footer from "@/components/landing/footer";

export default function Home() {
  return (
    <div className="relative min-h-screen bg-[#111315] text-[#D7DBE2] font-sans overflow-x-hidden">
      {/* Subtle noise texture */}
      <div className="noise-overlay" />

      <Navbar />
      <MainSection />
      <Footer />
    </div>
  );
}

