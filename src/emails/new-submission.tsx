import * as React from "react";
import { Section, Text } from "@react-email/components";
import { EmailLayout } from "./layout";

interface NewSubmissionEmailProps {
  type: string;
  name?: string | null;
  email?: string | null;
  content: string;
  isPublic: boolean;
}

export function NewSubmissionEmail({
  type,
  name,
  email,
  content,
  isPublic,
}: NewSubmissionEmailProps) {
  const typeLabel = type === "PRAYER_REQUEST" ? "Prayer Request" : "Testimony";

  return (
    <EmailLayout
      preview={`New ${typeLabel} Received`}
      heading={`New ${typeLabel}`}
    >
      <Text style={textStyle}>
        A new {typeLabel.toLowerCase()} has been submitted through the church website.
      </Text>

      <Section style={cardStyle}>
        <div style={rowStyle}>
          <span style={labelStyle}>Submitter:</span>
          <span style={valStyle}>{name || "Anonymous"}</span>
        </div>
        {email && (
          <div style={rowStyle}>
            <span style={labelStyle}>Email:</span>
            <span style={valStyle}>{email}</span>
          </div>
        )}
        <div style={rowStyle}>
          <span style={labelStyle}>Visibility:</span>
          <span style={valStyle}>{isPublic ? "Public (Awaiting Moderation)" : "Private / Pastoral"}</span>
        </div>
        <div style={contentBlockStyle}>
          <span style={labelStyle}>Message:</span>
          <p style={messageContentStyle}>{content}</p>
        </div>
      </Section>

      <Text style={textStyle}>
        You can review and moderate this submission in the church dashboard under <strong>Admin &gt; Moderation</strong>.
      </Text>
    </EmailLayout>
  );
}

const textStyle: React.CSSProperties = {
  color: "#374151",
  fontSize: "15px",
  lineHeight: "24px",
  margin: "0 0 16px",
};

const cardStyle: React.CSSProperties = {
  backgroundColor: "#f9fafb",
  border: "1px solid #e5e7eb",
  borderRadius: "8px",
  padding: "16px 20px",
  margin: "20px 0",
};

const rowStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  padding: "6px 0",
  borderBottom: "1px solid #f3f4f6",
};

const contentBlockStyle: React.CSSProperties = {
  paddingTop: "12px",
};

const messageContentStyle: React.CSSProperties = {
  backgroundColor: "#ffffff",
  border: "1px solid #e5e7eb",
  borderRadius: "6px",
  color: "#1f2937",
  fontSize: "14px",
  lineHeight: "22px",
  margin: "8px 0 0",
  padding: "12px",
  whiteSpace: "pre-wrap",
};

const labelStyle: React.CSSProperties = {
  color: "#6b7280",
  fontSize: "14px",
};

const valStyle: React.CSSProperties = {
  color: "#111827",
  fontSize: "14px",
  fontWeight: "500",
};
