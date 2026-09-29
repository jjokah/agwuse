import * as React from "react";
import { Section, Text } from "@react-email/components";
import { EmailLayout } from "./layout";

interface NewRegistrationEmailProps {
  name: string;
  email: string;
  phone?: string | null;
  registeredAt: string;
}

export function NewRegistrationEmail({
  name,
  email,
  phone,
  registeredAt,
}: NewRegistrationEmailProps) {
  return (
    <EmailLayout preview={`New Member Registration: ${name}`} heading="New Registration Pending">
      <Text style={textStyle}>
        A new member has completed email verification and is awaiting administrator approval.
      </Text>

      <Section style={cardStyle}>
        <div style={rowStyle}>
          <span style={labelStyle}>Name:</span>
          <span style={valStyle}>{name}</span>
        </div>
        <div style={rowStyle}>
          <span style={labelStyle}>Email:</span>
          <span style={valStyle}>{email}</span>
        </div>
        {phone && (
          <div style={rowStyle}>
            <span style={labelStyle}>Phone:</span>
            <span style={valStyle}>{phone}</span>
          </div>
        )}
        <div style={rowStyle}>
          <span style={labelStyle}>Registered:</span>
          <span style={valStyle}>{registeredAt}</span>
        </div>
      </Section>

      <Text style={textStyle}>
        Please sign in to the church dashboard under <strong>Admin &gt; Users &gt; Pending Approvals</strong> to review and approve this member.
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

const labelStyle: React.CSSProperties = {
  color: "#6b7280",
  fontSize: "14px",
};

const valStyle: React.CSSProperties = {
  color: "#111827",
  fontSize: "14px",
  fontWeight: "500",
};
