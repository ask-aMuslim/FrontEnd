export interface CertificateData {
  id: string;
  name: string;
  title: string;
  description: string;
  webpUrl: string;
  jpegUrl: string;
  svgUrl: string;
}

export const CERTIFICATES_DB: CertificateData[] = [
  {
    id: 'kholoud-elsisi',
    name: 'Kholoud Elsisi',
    title: 'Certificate of Excellence',
    description: 'Awarded for outstanding performance in the UX/UI Design Internship, demonstrating timely deliverables such as strong user-centered research, mid-fidelity wireframes, and high-fidelity interaction designs.',
    webpUrl: '/certificate-assets/Certificate-Kholoud-Elsisi.webp',
    jpegUrl: '/certificate-assets/Certificate-Kholoud-Elsisi.jpeg',
    svgUrl: '/certificate-assets/Certificate - Kholoud Elsisi.svg'
  },
  {
    id: 'nuha-abdelmeged',
    name: 'Nuha Abdelmeged',
    title: 'Certificate of Achievement',
    description: 'Awarded for outstanding performance in the UX/UI Design Internship, demonstrating timely deliverables such as strong user-centered research, mid-fidelity wireframes, and high-fidelity interaction designs.',
    webpUrl: '/certificate-assets/Certificate-Nuha-Abdelmeged.webp',
    jpegUrl: '/certificate-assets/Certificate-Nuha-Abdelmeged.jpeg',
    svgUrl: '/certificate-assets/Certificate - Nuha Abdelmeged.svg'
  }
];
