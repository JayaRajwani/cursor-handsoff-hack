/**
 * Frequently asked questions shown on the FAQ page (grouped by category).
 * The questions marked `featured: true` also appear on the home page.
 */
export type Faq = { question: string; answer: string; featured?: boolean };
export type FaqGroup = { category: string; slug: string; faqs: Faq[] };

export const faqGroups: FaqGroup[] = [
  {
    category: "About the courses",
    slug: "courses",
    faqs: [
      {
        question: "Who are MedAI Academy courses for?",
        answer:
          "Our courses are designed for healthcare professionals — doctors, nurses, pharmacists, allied health professionals, hospital administrators and medical, nursing and pharmacy students. No technical or AI experience is required.",
        featured: true,
      },
      {
        question: "Do I need any technical knowledge?",
        answer:
          "No. If you can use email and a web browser, you can take our courses. We explain every concept in plain language and show each step.",
        featured: true,
      },
      {
        question: "How long does a course take?",
        answer:
          "Most courses take between three and six hours in total, split into short lessons of 10–25 minutes. You can learn at your own pace on your phone, tablet or computer, and pick up where you left off.",
      },
      {
        question: "Can I preview a course before paying?",
        answer: "Yes. The first lessons of each course are free to preview, so you can judge the style and content before you enrol.",
      },
      {
        question: "Do the courses give medical advice?",
        answer:
          "No. Our courses teach you how to use AI tools for communication, education and administrative tasks. They are educational and do not provide medical advice. You must always follow your institution's policies and local regulations.",
      },
    ],
  },
  {
    category: "Enrolment and payment",
    slug: "payment",
    faqs: [
      {
        question: "How do I pay for a course?",
        answer:
          "You can pay by bank transfer, JazzCash or Easypaisa. After paying, upload a screenshot of your receipt and the transaction ID on the enrolment page. We verify payments — usually within 24 hours on working days — and email you as soon as your access is active.",
        featured: true,
      },
      {
        question: "Are prices shown in Pakistani rupees?",
        answer:
          "Yes, prices are in Pakistani rupees (PKR). An approximate US dollar amount is shown for reference. International card payments will be added in future.",
      },
      {
        question: "Can I get a refund?",
        answer: "Please see our Refund Policy for details of when refunds are available and how to request one.",
      },
      {
        question: "Can my hospital or organisation pay for a group?",
        answer:
          "Yes. We offer group enrolment, invoices and live training sessions for institutions. Visit the For Institutions page to send an enquiry.",
      },
    ],
  },
  {
    category: "Certificates",
    slug: "certificates",
    faqs: [
      {
        question: "Will I receive a certificate?",
        answer:
          "Yes. When you complete every lesson in a course, a certificate of completion is generated automatically. You can download it as a PDF from your dashboard.",
        featured: true,
      },
      {
        question: "How can an employer check my certificate?",
        answer:
          "Every certificate has a unique verification ID and a public verification page. Employers can enter the ID on our Verify page to confirm it is genuine.",
      },
      {
        question: "Are the certificates accredited for CPD/CME points?",
        answer:
          "Our certificates confirm course completion. Accreditation for continuing professional development varies by country and regulator — check with your professional body whether you can claim self-directed learning hours. (REVIEW BEFORE LAUNCH: update if you obtain accreditation.)",
      },
    ],
  },
  {
    category: "Safety and privacy",
    slug: "safety",
    faqs: [
      {
        question: "Is it safe to use AI tools with patient information?",
        answer:
          "You must never enter identifiable patient information into general-purpose AI tools unless your organisation has specifically approved the tool for that use. Our courses teach you how to work with invented or fully anonymised examples instead.",
        featured: true,
      },
      {
        question: "Do you share my personal data?",
        answer:
          "We only use your data to provide your account, courses and certificates, and we never sell it. See our Privacy Policy for full details.",
      },
    ],
  },
  {
    category: "Account and technical",
    slug: "account",
    faqs: [
      {
        question: "I forgot my password. What should I do?",
        answer: "Use the 'Forgot password?' link on the login page. We will email you a secure link to set a new password.",
      },
      {
        question: "Can I learn on my phone?",
        answer: "Yes. The whole site is designed for phones first, so you can learn during a break or on your commute.",
      },
      {
        question: "How long do I have access to a course?",
        answer: "Once your enrolment is approved, you have lifetime access to that course, including future updates.",
      },
    ],
  },
];

export const featuredFaqs = faqGroups.flatMap((group) => group.faqs.filter((faq) => faq.featured));
export const allFaqs = faqGroups.flatMap((group) => group.faqs);
