import * as React from "react";
import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";

interface EmailLayoutProps {
  preview: string;
  heading?: string;
  children: React.ReactNode;
}

export function EmailLayout({ preview, heading, children }: EmailLayoutProps) {
  return (
    <Html>
      <Head />
      <Preview>{preview}</Preview>
      <Body style={mainStyle}>
        <Container style={containerStyle}>
          <Section style={headerStyle}>
            <Heading style={brandHeadingStyle}>Assemblies of God Church</Heading>
            <Text style={brandSubtitleStyle}>Wuse Zone 5, Abuja</Text>
          </Section>

          <Section style={contentSectionStyle}>
            {heading && <Heading style={titleStyle}>{heading}</Heading>}
            {children}
          </Section>

          <Hr style={hrStyle} />

          <Section style={footerSectionStyle}>
            <Text style={footerTextStyle}>
              Assemblies of God Church, Wuse Zone 5, Abuja
              <br />
              53, Accra Street, Wuse Zone 5, Abuja, Nigeria
              <br />
              info@agwuse.org
            </Text>
            <Text style={disclaimerStyle}>
              This is an automated message from AG Wuse. If you received this by mistake, please disregard.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

const mainStyle: React.CSSProperties = {
  backgroundColor: "#f6f9fc",
  fontFamily:
    "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Ubuntu, sans-serif",
  margin: "0 auto",
  padding: "20px 0 48px",
};

const containerStyle: React.CSSProperties = {
  backgroundColor: "#ffffff",
  border: "1px solid #f0f0f0",
  borderRadius: "8px",
  margin: "0 auto",
  maxWidth: "580px",
  overflow: "hidden",
};

const headerStyle: React.CSSProperties = {
  backgroundColor: "#0d2040",
  padding: "24px 32px",
  textAlign: "center",
};

const brandHeadingStyle: React.CSSProperties = {
  color: "#ffffff",
  fontSize: "20px",
  fontWeight: "bold",
  margin: "0",
  letterSpacing: "0.5px",
};

const brandSubtitleStyle: React.CSSProperties = {
  color: "#d4af37",
  fontSize: "14px",
  margin: "4px 0 0",
};

const contentSectionStyle: React.CSSProperties = {
  padding: "32px 32px 24px",
};

const titleStyle: React.CSSProperties = {
  color: "#1a1a2e",
  fontSize: "20px",
  fontWeight: "600",
  marginBottom: "16px",
  marginTop: "0",
};

const hrStyle: React.CSSProperties = {
  borderColor: "#e6ebf1",
  margin: "0",
};

const footerSectionStyle: React.CSSProperties = {
  backgroundColor: "#fafbfc",
  padding: "24px 32px",
  textAlign: "center",
};

const footerTextStyle: React.CSSProperties = {
  color: "#6b7280",
  fontSize: "13px",
  lineHeight: "20px",
  margin: "0",
};

const disclaimerStyle: React.CSSProperties = {
  color: "#9ca3af",
  fontSize: "11px",
  lineHeight: "16px",
  margin: "12px 0 0",
};
