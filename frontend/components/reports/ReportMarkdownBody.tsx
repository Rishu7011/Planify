"use client";

import { ChatMarkdown } from "@/components/workspace/chat/ChatMarkdown";
import type { ReportContent } from "@/lib/reports";
import { reportMarkdownBody } from "@/lib/reports";

interface Props {
  content: ReportContent;
  reportType: string;
}

export function ReportMarkdownBody({ content, reportType }: Props) {
  const markdown = reportMarkdownBody(content);

  if (markdown) {
    return (
      <div className="r-doc-body">
        <ChatMarkdown content={markdown} className="text-[#B4BCCB]" />
      </div>
    );
  }

  return (
    <div className="r-doc-body">
      <p className="text-sm text-[var(--r-subtle)]">
        Report data is available but not in a displayable format yet. Return to the chat
        workspace and ask the AI to regenerate the {reportType.replace(/_/g, " ")} report.
      </p>
    </div>
  );
}
