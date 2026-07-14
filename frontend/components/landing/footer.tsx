import { Globe, Hexagon, MessageSquare, Share2 } from 'lucide-react'
import React from 'react'

const Footer = () => {
  return (
    <>
    <footer className="w-full bg-[#070F19] border-t border-white/5 pt-16 sm:pt-24 pb-8 relative z-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-8 px-4 sm:px-6 md:px-8 max-w-[1200px] mx-auto mb-12 sm:mb-16">
          <div className="sm:col-span-2 space-y-4">
            <div className="font-sans text-lg font-bold text-[#F7F8FC] tracking-tight flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-gradient-to-r from-[#4F8DFF] to-[#8E6BFF] grid place-items-center">
                <Hexagon className="w-4 h-4 text-white fill-white" />
              </span>
              Planify
            </div>
            <p className="text-[#7C869A] text-sm max-w-xs leading-relaxed">
              Enterprise-grade AI structuring tool. Transforming raw data into operational excellence.
            </p>
            <div className="flex space-x-4 pt-2">
              <a
                className="text-[#7C869A] hover:text-[#F7F8FC] transition-colors"
                href="#"
                aria-label="Language"
              >
                <Globe className="w-5 h-5" />
              </a>
              <a
                className="text-[#7C869A] hover:text-[#F7F8FC] transition-colors"
                href="#"
                aria-label="Forum"
              >
                <MessageSquare className="w-5 h-5" />
              </a>
              <a
                className="text-[#7C869A] hover:text-[#F7F8FC] transition-colors"
                href="#"
                aria-label="Share"
              >
                <Share2 className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Nav Links columns */}
          {[
            {
              title: "Product",
              links: ["Features", "Integrations", "Pricing", "Changelog"]
            },
            {
              title: "Solutions",
              links: ["For Engineering", "For Product", "Enterprise", "Startups"]
            },
            {
              title: "Resources",
              links: ["Documentation", "Blog", "Help Center", "Community"]
            },
            {
              title: "Company",
              links: ["About Us", "Careers", "Contact", "Partners"]
            }
          ].map((col) => (
            <div key={col.title} className="space-y-4 text-left">
              <h4 className="font-mono text-xs font-bold text-[#F7F8FC] uppercase tracking-wider">
                {col.title}
              </h4>
              <ul className="space-y-2 text-sm text-[#7C869A]">
                {col.links.map((link) => (
                  <li key={link}>
                    <a className="hover:text-[#F7F8FC] transition-colors" href="#">
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t border-white/5 px-4 sm:px-6 md:px-8 pt-8 max-w-[1200px] mx-auto flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-[#7C869A] text-center md:text-left">
          <div className="mb-4 md:mb-0">
            © 2026 Planify Enterprise. All rights reserved.
          </div>
          <div className="flex flex-wrap justify-center space-x-6">
            <a className="hover:text-[#B4BCCB] transition-colors" href="#">
              Privacy Policy
            </a>
            <a className="hover:text-[#B4BCCB] transition-colors" href="#">
              Terms of Service
            </a>
          </div>
        </div>
      </footer>
    </>
  )
}

export default Footer