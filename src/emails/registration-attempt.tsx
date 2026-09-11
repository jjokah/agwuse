import * as React from "react";
import { Button, Section, Text } from "@react-email/components";
import { EmailLayout } from "./layout";

interface RegistrationAttemptEmailProps {
  resetUrl: string;
}

export function RegistrationAttemptEmail({
  resetUrl,
}: RegistrationAttemptEmailProps) {
  return (
    <EmailLayout
      preview="Registration attempt on your AG Wuse account"
      heading="Registration Notice"
    >
      <Text style={textStyle}>
        Someone recently tried to register a new account on AG Wuse using your email address.
      </Text>
      <Text style={textStyle}>
        If this was you and you forgot your password, you can reset your password using the button below:
      </Text>

      <Section style={btnSectionStyle}>
        <Button style={buttonStyle} href={resetUrl}>
          Reset Password
        </Button>
      </Section>

      <Text style={subtextStyle}>
        If you did not make this request, you can safely disregard this message. Your account remains secure and no changes were made.
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
};
