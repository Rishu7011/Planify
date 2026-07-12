import Navbar from "@/components/landing/navbar";
import MainSection from "@/components/landing/mainSection";
import Footer from "@/components/landing/footer";

export default function Home() {

  return (
    <div className="relative min-h-screen bg-[#090B14] text-[#e1e2ec] font-sans selection:bg-[#aec6ff]/20 selection:text-[#aec6ff]">
      {/* Noise Overlay */}
      <div className="noise-overlay" />
      {/* TopNavBar */}
      <Navbar/>

      {/* {Main Section} */}
      <MainSection/>

      {/* Footer Section */}
      <Footer/>
    </div>
  );
}
