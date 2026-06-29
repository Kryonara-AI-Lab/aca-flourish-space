import { createFileRoute } from "@tanstack/react-router";
import { LegalLayout } from "@/components/LegalLayout";

export const Route = createFileRoute("/disclaimer")({
  head: () => ({
    meta: [
      { title: "Disclaimer — Lumio" },
      { name: "description", content: "Important disclaimers about using Lumio for studying." },
    ],
  }),
  component: DisclaimerPage,
});

function DisclaimerPage() {
  return (
    <LegalLayout title="Disclaimer" updated="June 29, 2026">
      <Section title="No academic guarantees">
        <p>Lumio is a personal organization tool. It does not guarantee any academic outcome, grade or exam result. Your success depends on your own work and study habits.</p>
      </Section>
      <Section title="Not legal, medical or professional advice">
        <p>Any content you find on Lumio's marketing pages is provided for general informational purposes only and does not constitute legal, medical, financial or professional advice.</p>
      </Section>
      <Section title="Academic honesty">
        <p>You are responsible for following your school's academic honesty policy. Do not upload, share or use exam material in ways that would violate that policy. Lumio is intended for personal study, not for circumventing assessments.</p>
      </Section>
      <Section title="Third-party content">
        <p>Some materials you choose to upload may be authored by others (e.g. lecture handouts, past exams). You are responsible for ensuring you have the right to store such materials in your private library.</p>
      </Section>
      <Section title={`Service "as is"`}>
        <p>Lumio is provided on an "as is" and "as available" basis without warranties of any kind, express or implied, including merchantability, fitness for a particular purpose or non-infringement.</p>
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
