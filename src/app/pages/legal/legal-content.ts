export interface LegalSection {
  heading: string;
  paragraphs?: string[];
  items?: string[];
}

export interface LegalDocument {
  title: string;
  intro: string;
  sections: LegalSection[];
}

export const SUPPORT_EMAIL = 'support@askamuslim.org';
// TODO: replace with the organization's registered physical address.
export const REGISTERED_ADDRESS = '[Registered physical address of Ask A Muslim Inc]';
export const LAST_UPDATED = 'November 11, 2026';

export const PRIVACY_POLICY: LegalDocument = {
  title: 'Privacy Policy',
  intro:
    'This Privacy Policy explains what information the Ask A Muslim mobile application and website ("Ask A Muslim") collect, why we collect it, and how Ask A Muslim Inc, a US-registered 501(c)(3) non-profit organization, protects it.',
  sections: [
    {
      heading: 'Information We Collect',
      paragraphs: ['When you create an account or use Ask A Muslim, we may collect:'],
      items: [
        'Account & profile data: your name, email address, phone number (if applicable), and any demographic or profile information you provide during sign-up or profile setup.',
        'App usage & learning progress: bookmarked Q&A topics and Learning Management System (LMS) progress associated with your account.',
        'Device & diagnostic identifiers: crash logs, performance metrics, and Firebase Cloud Messaging (FCM) push notification tokens.',
      ],
    },
    {
      heading: 'How We Use Your Information',
      paragraphs: [
        'We use your information strictly to authenticate you, personalize your learning and content experience, send important notifications, and improve app stability.',
      ],
    },
    {
      heading: 'Data Security & Sharing',
      items: [
        'All data transmitted between the Ask A Muslim app and our servers is encrypted in transit using HTTPS/TLS.',
        'Ask A Muslim Inc does not sell or rent your personal information to third-party advertisers.',
      ],
    },
    {
      heading: 'Data Retention & Account Deletion',
      paragraphs: [
        'You have the right to delete your account and all gathered personal information at any time. See the Account & Data Deletion page for instructions.',
      ],
    },
    {
      heading: 'Contact Us',
      paragraphs: [
        `For privacy questions, email ${SUPPORT_EMAIL}.`,
        `Ask A Muslim Inc, ${REGISTERED_ADDRESS}.`,
      ],
    },
  ],
};

export const TERMS_OF_USE: LegalDocument = {
  title: 'Terms of Use',
  intro:
    'These Terms of Use govern your use of the Ask A Muslim mobile application and website operated by Ask A Muslim Inc. By creating an account or using Ask A Muslim, you agree to these terms.',
  sections: [
    {
      heading: 'Educational Purpose',
      paragraphs: [
        'Content on Ask A Muslim, including questions and answers, courses and resources, is provided by our administrators for general educational purposes and is read-only for users. It is not a substitute for personal religious rulings (fatwa) from a qualified scholar.',
      ],
    },
    {
      heading: 'Your Account',
      items: [
        'You must provide accurate information when registering and keep your login credentials confidential.',
        'You are responsible for activity that occurs under your account.',
        'You may delete your account at any time as described on our Account & Data Deletion page.',
      ],
    },
    {
      heading: 'Acceptable Use',
      items: [
        'Do not misuse the service, attempt unauthorized access, or interfere with its operation.',
        'Do not copy, scrape, or redistribute our content for commercial purposes without written permission.',
        'Messages you send us (for example via contact or meeting-request forms) must be respectful and lawful.',
      ],
    },
    {
      heading: 'Intellectual Property',
      paragraphs: [
        'All content, logos, and materials on Ask A Muslim are owned by Ask A Muslim Inc or its licensors and are protected by applicable law. You may use them for personal, non-commercial learning.',
      ],
    },
    {
      heading: 'Disclaimer & Limitation of Liability',
      paragraphs: [
        'Ask A Muslim is provided "as is" without warranties of any kind. To the extent permitted by law, Ask A Muslim Inc is not liable for any damages arising from your use of the service.',
      ],
    },
    {
      heading: 'Privacy',
      paragraphs: [
        'Your use of Ask A Muslim is also governed by our Privacy Policy, which explains how we handle your information.',
      ],
    },
    {
      heading: 'Changes & Contact',
      paragraphs: [
        'We may update these terms from time to time; continued use means you accept the updated terms.',
        `Questions? Email ${SUPPORT_EMAIL}.`,
      ],
    },
  ],
};

export const DELETE_ACCOUNT: LegalDocument = {
  title: 'Account & Data Deletion Request',
  intro:
    'This is the Account & Data Deletion Request page for the Ask A Muslim mobile application by Ask A Muslim Inc. You can request deletion even if you have already uninstalled the app.',
  sections: [
    {
      heading: 'How to Request Deletion',
      items: [
        `Send an email from your registered email address to ${SUPPORT_EMAIL} with the subject line "Account Deletion Request - Ask A Muslim App".`,
        'If you still have the Ask A Muslim app installed, you can also delete your account directly inside the app by navigating to Profile -> Settings -> Delete Account.',
      ],
    },
    {
      heading: 'What Is Deleted',
      paragraphs: [
        'After we verify your request, your login credentials, email address, profile information, and personal activity and progress records are permanently purged from our database.',
      ],
    },
    {
      heading: 'What Is Retained',
      paragraphs: [
        'No personally identifiable information is retained after deletion.',
      ],
    },
    {
      heading: 'Processing Time',
      paragraphs: [
        'All account and data deletion requests are processed and completed within 7 business days.',
      ],
    },
  ],
};

