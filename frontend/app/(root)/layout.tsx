import React from 'react';

const Layout = async ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="min-h-screen text-[#e1e2ec] bg-[#090B14] font-sans antialiased selection:bg-[#aec6ff]/20 selection:text-[#aec6ff]">
      {children}
    </div>
  );
};

export default Layout;