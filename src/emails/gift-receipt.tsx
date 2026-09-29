import * as React from "react";
import { Container, Section, Text } from "@react-email/components";
import { EmailLayout } from "./layout";

interface GiftReceiptEmailProps {
  receiptNumber: string;
  amount: string;
  date: string;
  type: string;
  category?: string | null;
  memberName?: string | null;
}

export function GiftReceiptEmail({
  receiptNumber,
  amount,
  date,
  type,
  category,
  memberName,
}: GiftReceiptEmailProps) {
  return (
    <EmailLayout preview={`Official Receipt ${receiptNumber} - AG Wuse`} heading="Donation Receipt">
      <Text style={textStyle}>
        {memberName ? `Dear ${memberName},` : "Dear Beloved in Christ,"}
      </Text>
      <Text style={textStyle}>
        Thank you for your generous giving to the Lord&apos;s work at Assemblies of God Church, Wuse Zone 5. Your giving makes a profound impact in spreading the Gospel and ministering to our community.
      </Text>

      <Section style={receiptCardStyle}>
        <Text style={receiptHeaderStyle}>OFFICIAL RECEIPT</Text>
        <Text style={receiptNumberStyle}>{receiptNumber}</Text>

        <Container style={detailsTableStyle}>
          <div style={rowStyle}>
            <span style={labelStyle}>Date:</span>
            <span style={valStyle}>{date}</span>
          </div>
          <div style={rowStyle}>
            <span style={labelStyle}>Amount:</span>
            <span style={amountStyle}>{amount}</span>
          </div>
          <div style={rowStyle}>
            <span style={labelStyle}>Type:</span>
            <span style={valStyle}>{type}</span>
          </div>
          {category && (
            <div style={rowStyle}>
              <span style={labelStyle}>Category:</span>
              <span style={valStyle}>{category}</span>
            </div>
          )}
        </Container>
      </Section>

      <Text style={scriptureStyle}>
        &ldquo;Every man according as he purposeth in his heart, so let him give; not grudgingly, or of necessity: for God loveth a cheerful giver.&rdquo; — 2 Corinthians 9:7
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

const receiptCardStyle: React.CSSProperties = {
  backgroundColor: "#f9fafb",
  border: "1px solid #e5e7eb",
  borderRadius: "8px",
  padding: "20px",
  margin: "24px 0",
  textAlign: "center",
};

const receiptHeaderStyle: React.CSSProperties = {
  color: "#6b7280",
  fontSize: "12px",
  fontWeight: "600",
  letterSpacing: "1px",
  margin: "0",
};

const receiptNumberStyle: React.CSSProperties = {
  color: "#0d2040",
  fontSize: "20px",
  fontWeight: "bold",
  margin: "4px 0 16px",
};

const detailsTableStyle: React.CSSProperties = {
  textAlign: "left",
  width: "100%",
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

const amountStyle: React.CSSProperties = {
  color: "#0d2040",
  fontSize: "16px",
  fontWeight: "bold",
};

const scriptureStyle: React.CSSProperties = {
  color: "#6b7280",
  fontStyle: "italic",
  fontSize: "13px",
  lineHeight: "20px",
  margin: "24px 0 0",
  textAlign: "center",
};
