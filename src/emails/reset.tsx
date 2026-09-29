import * as React from "react";
import { Button, Link, Section, Text } from "@react-email/components";
import { EmailLayout } from "./layout";

interface ResetEmailProps {
  resetUrl: string;
}

export function ResetEmail({ resetUrl }: ResetEmailProps) {
  return (
    <EmailLayout preview="Reset your password - AG Wuse" heading="Password Reset Request">
      <Text style={textStyle}>
        We received a request to reset your password for your AG Wuse account. Click the button below to choose a new password.
      </Text>

      <Section style={btnSectionStyle}>
        <Button style={buttonStyle} href={resetUrl}>
          Reset Password
        </Button>
      </Section>

      <Text style={subtextStyle}>
        Or copy and paste this link into your browser:
        <br />
        <Link href={resetUrl} style={linkStyle}>
          {resetUrl}
        </Link>
      </Text>

      <Text style={noteStyle}>
        This link expires in 1 hour. If you did not request a password reset, you can safely ignore this email; your account remains secure.
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

const btnSectionStyle: React.CSSProperties = {
  textAlign: "center",
  margin: "24px 0",
};

const buttonStyle: React.CSSProperties = {
  backgroundColor: "#0d2040",
  borderRadius: "6px",
  color: "#ffffff",
  fontSize: "15px",
  fontWeight: "600",
  padding: "12px 24px",
  textDecoration: "none",
  display: "inline-block",
};

const subtextStyle: React.CSSProperties = {
  color: "#6b7280",
  fontSize: "13px",
  lineHeight: "20px",
  margin: "16px 0 0",
  wordBreak: "break-all",
};

const linkStyle: React.CSSProperties = {
  color: "#0d2040",
  textDecoration: "underline",
};

const noteStyle: React.CSSProperties = {
  color: "#9ca3af",
  fontSize: "12px",
  lineHeight: "18px",
  margin: "24px 0 0",
};
