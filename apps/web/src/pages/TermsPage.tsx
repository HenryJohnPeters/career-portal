import { Link } from "react-router-dom";
import { FREE_TIER, PREMIUM_FAIR_USE, PREMIUM_PRICE } from "@careerportal/shared/types";
import { ContactLink, LegalLayout, type LegalSection } from "./legal/LegalLayout";

/*
 * Generic terms for a UK consumer subscription service. Prices and limits
 * come from the shared plan constants so they can't drift from what is
 * enforced. The owner must review them (in particular cancellation/refunds,
 * liability and governing law) before launch.
 */
const SECTIONS: readonly LegalSection[] = [
  {
    id: "about",
    title: "About these terms",
    content: (
      <p>
        These terms are an agreement between you and careerRepo ("we", "us") for your use of the careerRepo website
        and app. By creating an account you accept them. Our <Link to="/privacy">Privacy Policy</Link> explains how we
        handle your personal data.
      </p>
    ),
  },
  {
    id: "account",
    title: "Your account",
    content: (
      <ul>
        <li>You must be at least 16 to use careerRepo, and at least 18 to buy a subscription.</li>
        <li>Give accurate details and keep your password secure. Don't share your account.</li>
        <li>You're responsible for what happens under your account. Tell us at once if you think someone else has used it.</li>
      </ul>
    ),
  },
  {
    id: "plans",
    title: "Free and Premium plans",
    content: (
      <>
        <p>
          The Free plan is free of charge and includes monthly allowances (for example {FREE_TIER.monthlyAiActions} AI
          actions and {FREE_TIER.monthlyMockSessions} mock interviews a month) and limits on how many CVs and cover
          letters you can keep. The current allowances are shown on our pricing and billing pages.
        </p>
        <p>
          Premium costs {PREMIUM_PRICE.label} a month. It removes those limits and adds Premium features. AI on Premium
          is "unlimited (fair use)": to keep the service fast and fair for everyone, it's capped at{" "}
          {PREMIUM_FAIR_USE.dailyAiActions} AI actions a day and {PREMIUM_FAIR_USE.monthlyAiActions} a month.
        </p>
        <p>
          We may change what each plan includes. If a change reduces what you've paid for, we'll tell you in advance
          and it will apply from your next billing period, so you can cancel first if you prefer.
        </p>
      </>
    ),
  },
  {
    id: "billing",
    title: "Payment, renewal and cancellation",
    content: (
      <ul>
        <li>Payments are processed by Stripe. Premium is billed monthly in advance and renews automatically until you cancel.</li>
        <li>
          You can cancel at any time from <strong>Billing → Manage billing</strong>. You keep Premium until the end of
          the period you've paid for and won't be charged again.
        </li>
        <li>
          If we offer a free trial, we'll tell you its length before you start. Unless you cancel before it ends, your
          subscription starts and you're charged when the trial finishes.
        </li>
        <li>
          If a payment fails, we'll ask you to update your payment method. Premium features may pause until the
          payment succeeds.
        </li>
        <li>
          If we change the price, we'll tell you at least 30 days before it applies to you, so you can cancel first if
          you prefer.
        </li>
      </ul>
    ),
  },
  {
    id: "cancellation-rights",
    title: "Your right to cancel and refunds",
    content: (
      <>
        <p>
          If you're a consumer in the UK, you can cancel your first Premium subscription within 14 days of buying it
          and get a refund. Because Premium starts as soon as you subscribe, we may deduct an amount for the service
          you used before you cancelled. To use this right, email <ContactLink /> within the 14 days.
        </p>
        <p>
          Outside that period, payments for a billing period that has started aren't refundable, except where the law
          requires otherwise or the service was faulty. Nothing in these terms affects your legal rights as a consumer.
        </p>
      </>
    ),
  },
  {
    id: "your-content",
    title: "Your content",
    content: (
      <>
        <p>
          You own what you create in careerRepo: your CVs, cover letters, notes, answers and submissions. You give us
          permission to store, process and display it only to provide the service to you, including sending it to our
          AI provider when you use an AI feature, and to create PDFs and exports.
        </p>
        <p>
          You're responsible for your content. Only add information you have the right to use, and take care with other
          people's personal details (for example referees' contact details).
        </p>
      </>
    ),
  },
  {
    id: "ai",
    title: "AI features and scores",
    content: (
      <>
        <p>
          AI-generated text can be inaccurate, incomplete or out of date. Always review it before you use it, and make
          sure your CV and applications describe your experience truthfully.
        </p>
        <p>
          CV match scores, interview scores and test self-checks are guidance to help you practise and improve. They
          aren't professional assessments, and we can't guarantee interviews, job offers or any other outcome.
        </p>
      </>
    ),
  },
  {
    id: "acceptable-use",
    title: "Acceptable use",
    content: (
      <>
        <p>Don't use careerRepo to:</p>
        <ul>
          <li>break the law, or upload content that is unlawful, harmful or infringes someone else's rights;</li>
          <li>access other people's accounts or data, or test, probe or bypass our security or plan limits;</li>
          <li>scrape, overload or disrupt the service, or access it by automated means other than our app;</li>
          <li>resell or share access to the service, or use it to build a competing product.</li>
        </ul>
        <p>We may suspend or close accounts that break these rules, and will tell you why unless the law prevents it.</p>
      </>
    ),
  },
  {
    id: "availability",
    title: "Availability and changes to the service",
    content: (
      <p>
        We work to keep careerRepo available and your data safe, but we can't promise the service will always be
        uninterrupted or error-free. We may need to pause it for maintenance, and we may change or remove features.
        If we stop providing a paid feature, we'll give you notice and, where appropriate, a pro-rata refund.
      </p>
    ),
  },
  {
    id: "ending",
    title: "Closing your account",
    content: (
      <p>
        You can delete your account at any time in{" "}
        <Link to="/app/settings#delete-account">Settings</Link>. This permanently deletes your data and cancels any
        subscription immediately. You can download a copy of your data first.
      </p>
    ),
  },
  {
    id: "liability",
    title: "Our responsibility to you",
    content: (
      <>
        <p>
          If we fail to comply with these terms, we're responsible for loss you suffer that is a foreseeable result of
          our breach or our failure to use reasonable care and skill. We aren't responsible for loss that wasn't
          foreseeable, or for business losses: careerRepo is for personal use in your own job search.
        </p>
        <p>
          Nothing in these terms limits our liability for death or personal injury caused by our negligence, for fraud,
          or for anything else that can't be limited by law, including your statutory rights as a consumer.
        </p>
      </>
    ),
  },
  {
    id: "changes",
    title: "Changes to these terms",
    content: (
      <p>
        We may update these terms, for example when we add features or the law changes. We'll update the date at the
        top of this page and, for significant changes, tell you by email or in the app before they take effect. If you
        don't agree, you can cancel and delete your account.
      </p>
    ),
  },
  {
    id: "law",
    title: "Governing law",
    content: (
      <p>
        These terms are governed by the law of England and Wales, and disputes may be brought in the courts of England
        and Wales. If you live in Scotland or Northern Ireland, you can also bring proceedings in your local courts.
      </p>
    ),
  },
  {
    id: "contact",
    title: "Contact us",
    content: (
      <p>
        Questions about these terms or your subscription: <ContactLink />.
      </p>
    ),
  },
];

export function TermsPage() {
  return (
    <LegalLayout
      title="Terms of Service"
      intro={
        <p>
          Please read these terms before using careerRepo. They explain what you can expect from us, what we expect from
          you, and how subscriptions, cancellation and refunds work.
        </p>
      }
      sections={SECTIONS}
    />
  );
}
