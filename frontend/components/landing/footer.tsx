'use client'
import React from 'react'
import { Globe, MessageSquare, Share2, Sparkles } from 'lucide-react'

const FOOTER_COLS = [
  {
    title: "Product",
    links: ["Features", "Pricing", "Integrations", "Changelog"],
  },
  {
    title: "Resources",
    links: ["Documentation", "Guides", "API Reference", "Community"],
  },
  {
    title: "Company",
    links: ["About", "Careers", "Blog", "Contact"],
  },
];

const SOCIAL = [
  { icon: Globe,          label: "Website",  href: "#" },
  { icon: MessageSquare,  label: "Community",href: "#" },
  { icon: Share2,         label: "Share",    href: "#" },
];

const Footer = () => {
  return (
    <footer
      className="relative w-full bg-[#111315] border-t border-white/10 pt-14 sm:pt-16 pb-8"
      aria-label="Site footer"
    >
      <div className="max-w-[1080px] mx-auto px-4 sm:px-6 md:px-8">

        {/* Top grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr] gap-10 mb-12">

          {/* Brand column */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <div
                className="size-8 rounded-xl flex justify-center items-center"
                style={{ background: "linear-gradient(135deg, oklch(0.55 0.09 195), oklch(0.75 0.12 190))" }}
              >
                <Sparkles className="size-4 text-[#0d1210]" />
              </div>
              <span className="font-semibold text-slate-50 text-[15px]">Planify</span>
            </div>

            <p className="max-w-[260px] leading-relaxed text-[#9BA3AF] text-sm">
              AI project intelligence that turns messy ideas into execution-ready
              plans for modern teams.
            </p>

            {/* Social icons */}
            <div className="flex items-center gap-3 pt-2">
              {SOCIAL.map(({ icon: Icon, label, href }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  className="size-8 transition-colors rounded-full bg-white/5 border border-white/10
                    flex justify-center items-center text-[#D7DBE2] hover:bg-white/10 hover:text-white"
                >
                  <Icon className="size-3.5" />
                </a>
              ))}
            </div>
          </div>

          {/* Link columns */}
          {FOOTER_COLS.map((col) => (
            <div key={col.title} className="flex flex-col gap-3">
              <span className="font-semibold text-slate-50 text-sm leading-5">
                {col.title}
              </span>
              {col.links.map((link) => (
                <a
                  key={link}
                  href="#"
                  className="text-[#9BA3AF] text-sm leading-5 hover:text-[#D7DBE2] transition-colors cursor-pointer"
                >
                  {link}
                </a>
              ))}
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="border-t border-white/10 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4">
          <span className="text-[#9BA3AF] text-xs leading-4">
            © 2025 Planify. All rights reserved.
          </span>
          <div className="flex items-center gap-6">
            <a href="#" className="text-[#9BA3AF] text-xs leading-4 hover:text-[#D7DBE2] transition-colors cursor-pointer">
              Privacy Policy
            </a>
            <a href="#" className="text-[#9BA3AF] text-xs leading-4 hover:text-[#D7DBE2] transition-colors cursor-pointer">
              Terms of Service
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer