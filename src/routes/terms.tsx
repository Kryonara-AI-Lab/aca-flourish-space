import { createFileRoute } from "@tanstack/react-router";
import { LegalLayout } from "@/components/LegalLayout";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms of Use — Spoude" },
      { name: "description", content: "The terms that govern your use of Spoude." },
    ],
  }),
  component: TermsPage,
});

function TermsPage() {
  return (
    <LegalLayout title="Terms of Use" updated="June 29, 2026">
      <Section title="1. Agreement">
        <p>
          By creating a Spoude account or using the service, you agree to these Terms of Use. If you
          do not agree, do not use Spoude.
        </p>
      </Section>
      <Section title="2. Eligibility">
        <p>
          You must be at least 13 years old (or the minimum digital-consent age in your
          jurisdiction) to use Spoude. If you are under 18, please make sure a parent or guardian
          agrees to these terms on your behalf.
        </p>
      </Section>
      <Section title="3. Your account">
        <p>
          You are responsible for keeping your credentials secure. We strongly recommend enabling
          two-factor authentication. You are responsible for all activity on your account.
        </p>
      </Section>
      <Section title="4. Your content">
        <p>
          You keep ownership of everything you upload to Spoude. You grant us a limited license only
          to store, transmit and display your content to you, as needed to operate the service.
        </p>
        <p>
          You must have the right to upload any content you store on Spoude. Do not upload
          copyrighted material you don't have permission to use, exam content covered by an academic
          honesty policy you've agreed to, or anything illegal.
        </p>
      </Section>
      <Section title="5. Acceptable use">
        <p>
          You agree not to: (a) abuse, disrupt or attempt to gain unauthorized access to Spoude; (b)
          upload malicious files; (c) violate any law or the rights of others; or (d) use Spoude to
          facilitate academic dishonesty as defined by your school.
        </p>
      </Section>
      <Section title="6. Service availability">
        <p>
          Spoude is provided on an "as is" and "as available" basis. We do not guarantee
          uninterrupted access and may modify or discontinue features at any time.
        </p>
      </Section>
      <Section title="7. Termination">
        <p>
          You may delete your account at any time from Settings. We may suspend or terminate
          accounts that violate these terms.
        </p>
      </Section>
      <Section title="8. Limitation of liability">
        <p>
          To the maximum extent permitted by law, Spoude and its operators are not liable for any
          indirect, incidental, special or consequential damages arising out of your use of the
          service.
        </p>
      </Section>
      <Section title="9. Changes">
        <p>
          We may update these terms from time to time. Continued use of Spoude after changes take
          effect constitutes acceptance.
        </p>
      </Section>
      <Section title="10. Contact">
        <p>
          Questions? Reach out at{" "}
          <a className="text-primary hover:underline" href="mailto:hello@spoude.app">
            hello@spoude.app
          </a>
          .
        </p>
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
