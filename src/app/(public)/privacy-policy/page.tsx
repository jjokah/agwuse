import type { Metadata } from "next";
import { CHURCH_INFO } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: `Privacy policy for ${CHURCH_INFO.name} website and services.`,
};

export default function PrivacyPolicyPage() {
  return (
    <div className="px-4 py-12">
      <div className="prose prose-lg mx-auto max-w-3xl dark:prose-invert">
        <h1>Privacy Policy</h1>
        <p className="lead">
          This privacy policy explains how {CHURCH_INFO.name} (&quot;we&quot;,
          &quot;us&quot;, or &quot;our&quot;) collects, uses, and protects your
          personal information.
        </p>
        <p>
          <em>Last updated: March 2026</em>
        </p>

        <h2>Information We Collect</h2>
        <p>We collect information you provide directly, including:</p>
        <ul>
          <li>Name, email address, and phone number when you register</li>
          <li>Profile information such as date of birth, address, and occupation</li>
          <li>Financial transaction data when you make donations or offerings</li>
          <li>Prayer requests and testimonies you submit</li>
          <li>Messages sent through our contact form</li>
        </ul>

        <h2>How We Use Your Information</h2>
        <ul>
          <li>To manage your church membership and account</li>
          <li>To process and record financial transactions</li>
          <li>To communicate church announcements, events, and updates</li>
          <li>To respond to your prayer requests and inquiries</li>
          <li>To maintain our member directory (visible only to registered members)</li>
        </ul>

        <h2>Data Protection</h2>
        <p>
          In accordance with the Nigeria Data Protection Regulation (NDPR), we
          are committed to protecting your personal data. We implement
          appropriate technical and organizational measures to safeguard your
          information against unauthorized access, alteration, or destruction.
        </p>

        <h2>Data Sharing</h2>
        <p>
          We do not sell, trade, or rent your personal information to third
          parties. We may share your data only:
        </p>
        <ul>
          <li>With church leadership for pastoral care purposes</li>
          <li>With our payment processor (Paystack) for online transactions</li>
          <li>When required by law or to protect our rights</li>
        </ul>

        <h2>Your Rights</h2>
        <p>You have the right to:</p>
        <ul>
          <li>Access your personal data</li>
          <li>Correct inaccurate information</li>
          <li>Request deletion of your data</li>
          <li>Withdraw consent for data processing</li>
        </ul>

        <h2>Cookies</h2>
        <p>
          We use essential cookies to maintain your session and preferences. No
          third-party tracking cookies are used.
        </p>

        <h2>Contact Us</h2>
        <p>
          For questions about this privacy policy or your data, contact us at{" "}
          <a href={`mailto:${CHURCH_INFO.email}`}>{CHURCH_INFO.email}</a> or
          visit us at {CHURCH_INFO.address}.
        </p>
      </div>
    </div>
  );
}
