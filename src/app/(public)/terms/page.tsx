import type { Metadata } from "next";
import { CHURCH_INFO } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: `Terms of service for ${CHURCH_INFO.name} website.`,
};

export default function TermsPage() {
  return (
    <div className="px-4 py-12">
      <div className="prose prose-lg mx-auto max-w-3xl dark:prose-invert">
        <h1>Terms of Service</h1>
        <p className="lead">
          By using the {CHURCH_INFO.name} website and services, you agree to the
          following terms.
        </p>
        <p>
          <em>Last updated: March 2026</em>
        </p>

        <h2>Acceptance of Terms</h2>
        <p>
          By accessing or using this website, you agree to be bound by these
          Terms of Service. If you do not agree, please do not use our services.
        </p>

        <h2>Use of Services</h2>
        <p>Our website provides the following services:</p>
        <ul>
          <li>Church information, news, and event listings</li>
          <li>Member registration and portal</li>
          <li>Online giving and donation processing</li>
          <li>Prayer request and testimony submissions</li>
          <li>Sermon and media access</li>
        </ul>

        <h2>User Accounts</h2>
        <ul>
          <li>You must provide accurate and complete registration information</li>
          <li>You are responsible for maintaining the security of your account</li>
          <li>You must not share your login credentials with others</li>
          <li>Accounts are subject to approval by church administration</li>
        </ul>

        <h2>Financial Transactions</h2>
        <p>
          All donations and financial contributions made through this platform
          are voluntary. Online payments are processed securely through Paystack.
          Receipts are generated for all recorded transactions.
        </p>

        <h2>Content Submission</h2>
        <p>
          Prayer requests and testimonies submitted through this website are
          subject to moderation. We reserve the right to approve, reject, or
          remove submitted content. By submitting content, you grant us
          permission to share it (when marked as public) within our church
          community.
        </p>

        <h2>Intellectual Property</h2>
        <p>
          All content on this website, including text, images, sermons, and
          media, is the property of {CHURCH_INFO.name} unless otherwise stated.
          You may not reproduce, distribute, or use our content without
          permission.
        </p>

        <h2>Limitation of Liability</h2>
        <p>
          This website is provided &quot;as is&quot; without warranties of any
          kind. We are not liable for any damages arising from your use of this
          website or its services.
        </p>

        <h2>Changes to Terms</h2>
        <p>
          We may update these terms from time to time. Continued use of the
          website after changes constitutes acceptance of the updated terms.
        </p>

        <h2>Contact</h2>
        <p>
          For questions about these terms, contact us at{" "}
          <a href={`mailto:${CHURCH_INFO.email}`}>{CHURCH_INFO.email}</a>.
        </p>
      </div>
    </div>
  );
}
