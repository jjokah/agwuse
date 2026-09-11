import * as React from "react";
import { Button, Link, Section, Text } from "@react-email/components";
import { EmailLayout } from "./layout";

interface VerifyEmailProps {
  verifyUrl: string;
}

export function VerifyEmail({ verifyUrl }: VerifyEmailProps) {
  return (
    <EmailLayout preview="Verify your email address - AG Wuse" heading="Welcome to AG Wuse!">
      <Text style={textStyle}>
        Thank you for registering. Please verify your email address to begin your membership process.
      </Text>

      <Section style={btnSectionStyle}>
        <Button style={buttonStyle} href={verifyUrl}>
          Verify Email Address
        </Button>
      </Section>

      <Text style={subtextStyle}>
        Or copy and paste this URL into your browser:
        <br />
        <Link href={verifyUrl} style={linkStyle}>
          {verifyUrl}
        </Link>
      </Text>

      <Text style={noteStyle}>
        This verification link will expire in 24 hours. Once verified, your account will be reviewed for admin approval.
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
