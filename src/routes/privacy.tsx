import { createFileRoute } from "@tanstack/react-router";
import { LegalLayout } from "@/components/LegalLayout";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy — Lumio" },
      { name: "description", content: "How Lumio collects, uses and protects your information." },
    ],
  }),
  component: PrivacyPage,
});

function PrivacyPage() {
  return (
    <LegalLayout title="Privacy Policy" updated="June 29, 2026">
      <Section title="Overview">
        <p>This page is maintained by the Lumio team to explain how Lumio handles your personal information. Lumio is a tool for organizing your own study materials; we collect the minimum needed to run the service.</p>
      </Section>
      <Section title="Information we collect">
        <ul className="list-disc pl-5 space-y-1.5">
          <li><strong>Account data</strong> — your email address, display name, and (if you choose) avatar URL.</li>
          <li><strong>Authentication</strong> — encrypted password and, optionally, a TOTP authenticator factor.</li>
          <li><strong>Uploaded materials</strong> — the files, titles, subjects and descriptions you choose to upload.</li>
          <li><strong>Operational logs</strong> — basic security and error logs needed to keep the service running.</li>
        </ul>
      </Section>
      <Section title="How we use information">
        <p>We use your information only to (a) provide the service to you, (b) keep your account secure, and (c) comply with the law. We do not sell your data, and we do not use the contents of your uploads to train AI models.</p>
      </Section>
      <Section title="Storage and security">
        <p>Your files are stored privately. Access is restricted with row-level access policies so only your account can read them. Connections to Lumio are encrypted in transit (HTTPS).</p>
        <p>No system is perfectly secure. We strongly recommend enabling two-factor authentication and using a strong, unique password.</p>
      </Section>
      <Section title="Subprocessors">
        <p>Lumio relies on managed cloud infrastructure to host the application, database and file storage. These providers process data only on our instructions and under contractual confidentiality obligations.</p>
      </Section>
      <Section title="Your rights">
        <p>You can update or delete your account information at any time from Settings. To request a full export or deletion of your data, contact us at <a className="text-primary hover:underline" href="mailto:privacy@lumio.io">privacy@lumio.io</a>.</p>
      </Section>
      <Section title="Children">
        <p>Lumio is not directed at children under 13. If you believe a child has provided us with personal information, please contact us so we can remove it.</p>
      </Section>
      <Section title="Changes">
        <p>We will post updates to this page with a new "Last updated" date. Material changes will also be communicated by email when feasible.</p>
      </Section>
    </LegalLayout>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-lg font-semibold">{title}</h2>
      <div className="mt-2 text-sm text-muted-foreground leading-relaxed space-y-3">{children}</div>
    </section>
  );
}
