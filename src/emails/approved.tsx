import * as React from "react";
import { Button, Section, Text } from "@react-email/components";
import { EmailLayout } from "./layout";

interface ApprovedEmailProps {
  name: string;
  loginUrl: string;
}

export function ApprovedEmail({ name, loginUrl }: ApprovedEmailProps) {
  return (
    <EmailLayout preview="Your AG Wuse account has been approved!" heading="Account Approved">
      <Text style={textStyle}>Dear {name},</Text>
      <Text style={textStyle}>
        We are thrilled to inform you that your membership account at Assemblies of God Church, Wuse Zone 5 has been approved!
      </Text>
      <Text style={textStyle}>
        You now have access to member resources, the church directory, your giving history, and community departments.
      </Text>

      <Section style={btnSectionStyle}>
        <Button style={buttonStyle} href={loginUrl}>
          Sign In to Your Account
        </Button>
      </Section>

      <Text style={subtextStyle}>
        God bless you, and welcome to our church family!
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
  fontSize: "14px",
  lineHeight: "22px",
  margin: "16px 0 0",
};
