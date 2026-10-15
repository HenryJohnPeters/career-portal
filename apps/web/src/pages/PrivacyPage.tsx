import { Link } from "react-router-dom";
import { ContactLink, LegalLayout, type LegalSection } from "./legal/LegalLayout";

/*
 * Generic policy, accurate to how the app works today (Supabase auth, Stripe
 * payments, OpenAI for AI features, Railway hosting; no analytics or ad
 * trackers). The app's own fonts are self-hosted, but the CV preview loads the
 * CV templates' fonts from Google Fonts; drop that entry once those fonts are
 * self-hosted too. The owner must review it before launch and keep it in step
 * with any new processor or data use.
 */
const SECTIONS: readonly LegalSection[] = [
  {
    id: "who-we-are",
    title: "Who we are",
    content: (
      <p>
        careerRepo ("we", "us") provides an online toolkit for job seekers: a CV builder, cover letters, a job
        application tracker, interview practice and technical tests. We decide how and why your personal data is used
        for the service, which makes us its controller. You can contact us about anything in this policy at{" "}
        <ContactLink />.
      </p>
    ),
  },
  {
    id: "data-we-collect",
    title: "The data we collect",
    content: (
      <>
        <ul>
          <li>
            <strong>Account details:</strong> your email address and name. Your password is handled by our
            authentication provider, Supabase; we never see or store it.
          </li>
          <li>
            <strong>What you create:</strong> CVs (including any contact details you add, such as phone number,
            location and profile links), cover letters, the jobs you track (company, role, notes, job descriptions,
            dates and anything else you enter), your interview practice answers and scores, and your technical test
            submissions and reviews.
          </li>
          <li>
            <strong>Subscription details:</strong> your plan, subscription status and renewal dates, and the Stripe
            customer and subscription references. Card details go straight to Stripe; we never receive your full
            card number.
          </li>
          <li>
            <strong>Usage records:</strong> how many AI actions, practice sessions and tests you've used (to apply plan
            limits and fair use), including which AI model handled a request and its size, and a log of security and
            billing events on your account.
          </li>
          <li>
            <strong>Technical data:</strong> our servers and hosting provider process your IP address and request
            details to run and protect the service.
          </li>
        </ul>
        <p>
          <strong>On your device:</strong> we store your sign-in session and a few preferences (such as light or dark
          theme, interviewer voice on or off, and unsent drafts) in your browser's local storage. We don't use
          advertising or analytics cookies or trackers. Stripe's checkout and billing pages, which are hosted by Stripe,
          use their own cookies, including for fraud prevention.
        </p>
      </>
    ),
  },
  {
    id: "how-we-use-it",
    title: "How we use your data",
    content: (
      <>
        <ul>
          <li>
            <strong>To provide the service</strong> you signed up for: storing your work, creating PDFs, tracking your
            applications and applying your plan's limits (performance of our contract with you).
          </li>
          <li>
            <strong>For AI features, when you use them:</strong> the content needed for that request (for example the
            CV sections, job description, cover letter or answer you're working on) is sent to OpenAI to generate the
            result (performance of our contract).
          </li>
          <li>
            <strong>To take payments</strong> and keep the records the law requires (contract and legal obligation).
          </li>
          <li>
            <strong>To keep the service secure and fair:</strong> preventing abuse, enforcing fair-use limits and
            fixing problems (our legitimate interests in running a safe, reliable service).
          </li>
          <li>
            <strong>To send account emails,</strong> such as confirming your address or resetting your password. We
            don't send marketing emails.
          </li>
        </ul>
        <p>
          We don't sell your data, use it for advertising, or use your content to train AI models.
        </p>
      </>
    ),
  },
  {
    id: "who-we-share-it-with",
    title: "Who we share it with",
    content: (
      <>
        <p>We use these providers to run careerRepo. They process data on our behalf and only as we instruct:</p>
        <ul>
          <li>
            <strong>Supabase</strong> — sign-in and account security (your email address, password and sign-in
            sessions) and sending account emails.
          </li>
          <li>
            <strong>Stripe</strong> — payments and subscriptions, including your payment details.
          </li>
          <li>
            <strong>OpenAI</strong> — AI features. Only the content you submit to an AI feature is sent, when you use
            it. Under OpenAI's API terms, this content isn't used to train their models by default.
          </li>
          <li>
            <strong>Railway</strong> — hosting for our application and database, where your account data and content
            are stored.
          </li>
        </ul>
        <p>
          The CV builder's live preview also loads the typefaces of CV templates from <strong>Google Fonts</strong>,
          so your browser sends Google your IP address and browser details when you open it. No CV content is sent.
        </p>
        <p>
          We may also disclose data if the law requires it, or to protect the rights and safety of our users or the
          service.
        </p>
      </>
    ),
  },
  {
    id: "international-transfers",
    title: "International transfers",
    content: (
      <p>
        Some of these providers process data outside the UK, for example in the United States. Where they do, we rely
        on the safeguards UK data protection law provides, such as adequacy regulations (including the UK–US data
        bridge) or the International Data Transfer Addendum to standard contractual clauses.
      </p>
    ),
  },
  {
    id: "retention",
    title: "How long we keep it",
    content: (
      <>
        <p>
          We keep your data for as long as you have an account. When you delete your account, we delete your account
          and everything in it from our database straight away, cancel any subscription, and remove your sign-in
          identity from Supabase.
        </p>
        <p>Some records last longer:</p>
        <ul>
          <li>Stripe keeps payment and invoice records for as long as tax and accounting law requires.</li>
          <li>Security and billing event logs are kept with your identity removed.</li>
          <li>Backups made by our hosting provider are overwritten on its regular backup cycle.</li>
          <li>
            OpenAI may keep content sent to its API for a limited period for abuse monitoring, under its own policies.
          </li>
        </ul>
      </>
    ),
  },
  {
    id: "your-rights",
    title: "Your rights",
    content: (
      <>
        <p>Under UK data protection law you can:</p>
        <ul>
          <li>access the personal data we hold about you, and get a copy in a portable format;</li>
          <li>correct inaccurate data;</li>
          <li>have your data deleted;</li>
          <li>object to, or ask us to restrict, how we use it.</li>
        </ul>
        <p>
          You can do the most common of these yourself in{" "}
          <Link to="/app/settings#data">Settings</Link>: download all your data as a file, edit your name and email,
          or delete your account. For anything else, email <ContactLink />. We'll reply within one month.
        </p>
        <p>
          If you're unhappy with how we've handled your data, you can complain to the Information Commissioner's Office
          at{" "}
          <a href="https://ico.org.uk/make-a-complaint/" target="_blank" rel="noopener noreferrer">
            ico.org.uk
          </a>
          . We'd appreciate the chance to put things right first.
        </p>
      </>
    ),
  },
  {
    id: "security",
    title: "Security",
    content: (
      <p>
        All connections to careerRepo are encrypted (HTTPS). Passwords are managed by Supabase and stored only in hashed
        form, payment details are handled by Stripe, and access to your data is limited to what's needed to run the
        service. No online service can be perfectly secure, so please use a strong, unique password and sign out of
        shared devices (Settings has a "Sign out everywhere" option).
      </p>
    ),
  },
  {
    id: "children",
    title: "Children",
    content: <p>careerRepo isn't intended for children under 16, and we don't knowingly collect their data.</p>,
  },
  {
    id: "changes",
    title: "Changes to this policy",
    content: (
      <p>
        If we change this policy, we'll update the date at the top of this page. If a change significantly affects
        how we use your data, we'll tell you by email or in the app before it takes effect.
      </p>
    ),
  },
  {
    id: "contact",
    title: "Contact us",
    content: (
      <p>
        Questions or requests about your data: <ContactLink />.
      </p>
    ),
  },
];

export function PrivacyPage() {
  return (
    <LegalLayout
      title="Privacy Policy"
      intro={
        <p>
          This policy explains what personal data careerRepo collects, why, who we share it with and the choices you
          have. We've kept it short and specific to how the service actually works.
        </p>
      }
      sections={SECTIONS}
    />
  );
}
