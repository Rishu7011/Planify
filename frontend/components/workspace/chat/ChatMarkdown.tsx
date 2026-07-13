"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface Props {
  content: string;
  className?: string;
}

export function ChatMarkdown({ content, className = "" }: Props) {
  return (
    <div
      className={`chat-markdown break-words text-sm leading-relaxed text-[#B4BCCB] md:text-[15px] md:leading-7 ${className}`}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          p: ({ children }) => (
            <p className="mb-3 last:mb-0 [&:empty]:hidden">{children}</p>
          ),
          ul: ({ children }) => (
            <ul className="mb-3 list-disc space-y-1 pl-5 last:mb-0">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="mb-3 list-decimal space-y-1 pl-5 last:mb-0">{children}</ol>
          ),
          li: ({ children }) => <li className="text-[#B4BCCB]">{children}</li>,
          strong: ({ children }) => (
            <strong className="font-semibold text-[#F7F8FC]">{children}</strong>
          ),
          em: ({ children }) => <em className="italic text-[#B4BCCB]">{children}</em>,
          h1: ({ children }) => (
            <h1 className="mb-2 mt-4 text-base font-semibold text-[#F7F8FC] first:mt-0">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="mb-2 mt-3 text-sm font-semibold text-[#F7F8FC] first:mt-0">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="mb-1 mt-2 text-sm font-medium text-[#F7F8FC] first:mt-0">
              {children}
            </h3>
          ),
          blockquote: ({ children }) => (
            <blockquote className="my-3 border-l-2 border-[#AEC6FF]/40 pl-4 text-[#7C869A] italic">
              {children}
            </blockquote>
          ),
          a: ({ href, children }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#AEC6FF] underline decoration-[#AEC6FF]/40 underline-offset-2 hover:decoration-[#AEC6FF]"
            >
              {children}
            </a>
          ),
          code: ({ className: codeClass, children, ...props }) => {
            const isBlock = codeClass?.includes("language-");
            if (isBlock) {
              return (
                <code
                  className={`${codeClass} block overflow-x-auto rounded-lg bg-[#090B14]/80 p-3 font-mono text-xs text-[#E8EAED]`}
                  {...props}
                >
                  {children}
                </code>
              );
            }
            return (
              <code
                className="rounded bg-white/[0.06] px-1.5 py-0.5 font-mono text-[0.85em] text-[#AEC6FF]"
                {...props}
              >
                {children}
              </code>
            );
          },
          pre: ({ children }) => (
            <pre className="my-3 overflow-x-auto rounded-xl border border-white/[0.08] bg-[#090B14]/60 p-0 last:mb-0">
              {children}
            </pre>
          ),
          table: ({ children }) => (
            <div className="my-3 overflow-x-auto rounded-lg border border-white/[0.08]">
              <table className="min-w-full text-left text-xs">{children}</table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className="border-b border-white/[0.08] bg-white/[0.04]">{children}</thead>
          ),
          th: ({ children }) => (
            <th className="px-3 py-2 font-semibold text-[#F7F8FC]">{children}</th>
          ),
          td: ({ children }) => (
            <td className="border-t border-white/[0.06] px-3 py-2 text-[#B4BCCB]">{children}</td>
          ),
          hr: () => <hr className="my-4 border-white/[0.08]" />,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
