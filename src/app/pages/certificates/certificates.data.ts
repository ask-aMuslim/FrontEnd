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
    description: 'Awarded for outstanding contribution to the Ask A Muslim project and dedication to spreading knowledge.',
    webpUrl: '/certificate-assets/Certificate-Kholoud-Elsisi.webp',
    jpegUrl: '/certificate-assets/Certificate-Kholoud-Elsisi.jpeg',
    svgUrl: '/certificate-assets/Certificate - Kholoud Elsisi.svg'
  },
  {
    id: 'nuha-abdelmeged',
    name: 'Nuha Abdelmeged',
    title: 'Certificate of Achievement',
    description: 'Recognized for exceptional commitment to community engagement and educational support.',
    webpUrl: '/certificate-assets/Certificate-Nuha-Abdelmeged.webp',
    jpegUrl: '/certificate-assets/Certificate-Nuha-Abdelmeged.jpeg',
    svgUrl: '/certificate-assets/Certificate - Nuha Abdelmeged.svg'
  }
];
