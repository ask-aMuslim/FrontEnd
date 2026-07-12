
import { type ResolveFn } from '@angular/router';
import { of } from 'rxjs';





export interface ResourceCard {
  readonly id: string;
  readonly title: string;
  readonly subtitle: string;
  readonly articleUrl: string;
  readonly articleId?: string;
  readonly tagId?: string;
  readonly downloadUrl: string;
  readonly thumbnailUrl: string;
  readonly thumbnailUrls?: readonly string[];
  readonly thumbnailAlt: string;
  readonly driveFileId?: string;
}

export interface ResourceTab {
  readonly id: string;
  readonly label: string;
}

export type ResourceGalleryId = 'gallery-1' | 'gallery-2';

export interface ResourceGallery {
  readonly id: ResourceGalleryId;
  readonly eyebrow?: string;
  readonly title?: string;
  readonly surface: 'base' | 'surface';
  readonly tabs: readonly ResourceTab[];
  readonly cardsByTab: Readonly<Record<string, readonly ResourceCard[]>>;
}

export interface NewMuslimCard {
  readonly id: string;
  readonly title: string;
  readonly subtitle: string;
  readonly url?: string;
}

export interface ResourcesResolvedData {
  readonly galleries: readonly ResourceGallery[];
  readonly newMuslimCards: readonly NewMuslimCard[];
}

const cardThumbnailFallback = '/images/events-image-placeholder.jpg';

const driveFileIdsByAssetPath: Readonly<Record<string, string>> = {
  // Pamphlets
  "resources/pamphlets/AAM%20Pamphlets/AAM%20Da'wah%20Pamphlet.pdf":
    '1qa4b1kYLmbE30sQZKzSLWNSxiiB30XPU',
  'resources/pamphlets/AAM%20Pamphlets/AAM%20Foretold%20Pamphlet.pdf':
    '1LjxnLZxDXHGc30fx9qIvKevD3mqpSlin',
  'resources/pamphlets/AAM%20Pamphlets/AAM%20Jesus%20Pamphlet.pdf':
    '1WMaXiizFCIzeAmGADdSRerRFK7aCMtoj',
  'resources/pamphlets/AAM%20Pamphlets/AAM%20Misconceptions%20Pamphlet.pdf':
    '1Th5LIEVPVKIlVOZOr9tCoMsu0LmQCV6A',
  'resources/pamphlets/AAM%20Pamphlets/AAM%20Prophecy%20Pamphlet.pdf':
    '1JJslu5uJuOkHNbpu5FuTAjy2eQTqBwOB',
  'resources/pamphlets/AAM%20Pamphlets/AAM%20Prophet%20Muhammad%20Pamphlet.pdf':
    '1Tq4fBKpggRrZRteU35pO1VRhWA78wfIM',
  'resources/pamphlets/AAM%20Pamphlets/AAM%20Science%20Pamphlet.pdf':
    '1sQJdKS-ZrOcJHf0XpRXNjpgCfNXCOspF',
  'resources/pamphlets/AAM%20Pamphlets/AAM%20Truth%20Pamphlet.pdf':
    '13CTfSg8h0SAcaFgfEjLNvSqjt85y3rUF',
  'resources/pamphlets/AAM%20Pamphlets/AAM%20Women%20Pamphlet.pdf':
    '1GBeXoudcR58OTA72a9uJ6z7mAeFfy3q-',

  // Scientific posters
  'resources/scientific-posters/PDF%20Versions/AAM%20Atmosphere%20Protects%20Humans%20on%20Earth%20.pdf':
    '1ehaVXOjOhBxe5KuETgJIfSXOV4kEq2xk',
  'resources/scientific-posters/PDF%20Versions/AAM%20Big%20Bang%20in%20the%20Quran.pdf':
    '1U0SW40F_9b1bdtYdGonC-lWoWgLAf1aB',
  'resources/scientific-posters/PDF%20Versions/AAM%20Expansion%20of%20The%20Universe.pdf':
    '1pAG4fpNs0iJ6KWm_6V294_0mQ323Zch2',
  'resources/scientific-posters/PDF%20Versions/AAM%20Heavy%20Clouds.pdf':
    '1k0_mAzy1yY9Atv9HrkluN0fGs5d-al65',
  'resources/scientific-posters/PDF%20Versions/AAM%20Human%20Embrology.pdf':
    '1U_9UVx8_ff0sf0vPQzCL608LXMCmbSGH',
  'resources/scientific-posters/PDF%20Versions/AAM%20Iron%20Is%20not%20from%20the%20Earth.pdf':
    '12wyjY3EimYK3TRcrzwgG2-l7kakj7YC9',
  'resources/scientific-posters/PDF%20Versions/AAM%20Mountains%20Stability.pdf':
    '1kdrGz5x5vzLEHfa7eRJUaUq5QO_rdRod',
  'resources/scientific-posters/PDF%20Versions/AAM%20Ocean%20Internal%20Waves.pdf':
    '1bpduh6CmmvjgizY4SC26yShh2yz2F0XK',
  'resources/scientific-posters/PDF%20Versions/AAM%20Orbit%20of%20the%20Sun%20.pdf':
    '14ADxLlkzdEj0ozKM-q0SRSq8-Z-AWRut',
  'resources/scientific-posters/PDF%20Versions/AAM%20Skin%20as%20Pain%20Receptors.pdf':
    '1-hzlvKg-IID0TNP0wQA77TcuQ-0TRsOE',
  'resources/scientific-posters/PDF%20Versions/AAM%20The%20Bee.pdf':
    '1C8QGClXfoEdKMlkKvIwR_lYeI0BGaIVo',
  'resources/scientific-posters/PDF%20Versions/AAM%20The%20Universe%20as%20Smoke.pdf':
    '1_VXW17F2PBqzozPJzRBPZFdgmgrkCqCB',
  'resources/scientific-posters/PDF%20Versions/AAM%20Time%20Dilation%20and%20Speed%20of%20Light.pdf':
    '1LtMv3hguLYbR4jd6FMIYxFkWA9Zt_Pld',
  'resources/scientific-posters/PDF%20Versions/AAM%20Two%20Oceans%20Poster%20.pdf':
    '1H3SvJpB269MbVnwEmbckaVWZ8674AEZ9',
  'resources/scientific-posters/PDF%20Versions/AAM%20Water%20Makes%20up%20Life.pdf':
    '1KnHuYfa7utQ4QZGwfMQxj2hU1TYTx-QO',

  // Prophecy posters
  'resources/prophecy-posters/PDF%20Versions/AAM%20Euphrates%20River.pdf':
    '1sjfOv63mloY9OZhhKfinKk6bk_6X5aAk',
  'resources/prophecy-posters/PDF%20Versions/AAM%20Green%20Deserts.pdf':
    '1YjjUCwVHNqtcySRyqrx0M5HEKj1u1lic',
  "resources/prophecy-posters/PDF%20Versions/AAM%20Khosrow's%20Bangles.pdf":
    '13knpzyBTZf9RFZZeRwENF4zFcBEjSJTg',
  'resources/prophecy-posters/PDF%20Versions/AAM%20Mongol%20Invasion.pdf':
    '1HrSBiFNZy9SnB-F-CHPkuI6nync4QJ58',
  'resources/prophecy-posters/PDF%20Versions/AAM%20Rise%20of%20Interest.pdf':
    '1RWqeLklJP6-XWJAiY9bIXlfBkebcdFbR',
  'resources/prophecy-posters/PDF%20Versions/AAM%20Romans%20and%20Persians.pdf':
    '1hIfEVg2WPkPr_p51z_d9OSK6Ar9FAUy_',
  'resources/prophecy-posters/PDF%20Versions/AAM%20Spread%20of%20Islam.pdf':
    '1L5zqKNaubYsjsaAOkfnXX-96--7SlRDi',
  'resources/prophecy-posters/PDF%20Versions/AAM%20Tallest%20Buildings.pdf':
    '19FeZje-NU43Kqn0bFhDUWGrf-dlGMI_y',
  'resources/prophecy-posters/PDF%20Versions/AAM%20The%20State%20of%20Abu%20Lahab.pdf':
    '148bY-HPVycjiniJymtc6IEHAwuCqKdVo',
  'resources/prophecy-posters/PDF%20Versions/AAM%20Widespread%20Immorality.pdf':
    '1-tjMLOZbPx3iGOf7g_Tjjelw-3OXcKl4',
};

const pamphletPdfFiles: readonly string[] = [
  'AAM Truth Pamphlet.pdf',
  'AAM Science Pamphlet.pdf',
  'AAM Prophecy Pamphlet.pdf',
  'AAM Foretold Pamphlet.pdf',
  'AAM Jesus Pamphlet.pdf',
  'AAM Prophet Muhammad Pamphlet.pdf',
  'AAM Misconceptions Pamphlet.pdf',
  'AAM Women Pamphlet.pdf',
  "AAM Da'wah Pamphlet.pdf",
];

const scientificPosterPdfFiles: readonly string[] = [
  'AAM Atmosphere Protects Humans on Earth .pdf',
  'AAM Big Bang in the Quran.pdf',
  'AAM Expansion of The Universe.pdf',
  'AAM Heavy Clouds.pdf',
  'AAM Human Embrology.pdf',
  'AAM Iron Is not from the Earth.pdf',
  'AAM Mountains Stability.pdf',
  'AAM Ocean Internal Waves.pdf',
  'AAM Orbit of the Sun .pdf',
  'AAM Skin as Pain Receptors.pdf',
  'AAM The Bee.pdf',
  'AAM The Universe as Smoke.pdf',
  'AAM Time Dilation and Speed of Light.pdf',
  'AAM Two Oceans Poster .pdf',
  'AAM Water Makes up Life.pdf',
];

const prophecyPosterPdfFiles: readonly string[] = [
  'AAM Euphrates River.pdf',
  'AAM Green Deserts.pdf',
  "AAM Khosrow's Bangles.pdf",
  'AAM Mongol Invasion.pdf',
  'AAM Rise of Interest.pdf',
  'AAM Romans and Persians.pdf',
  'AAM Spread of Islam.pdf',
  'AAM Tallest Buildings.pdf',
  'AAM The State of Abu Lahab.pdf',
  'AAM Widespread Immorality.pdf',
];

const toAssetPath = (pathSegments: readonly string[]): string => {
  return pathSegments.map((segment) => encodeURIComponent(segment)).join('/');
};

const toDisplayTitle = (fileName: string): string => {
  return fileName
    .replace(/\.pdf$/i, '')
    .replace(/^Finalized\s+289x214mm\s+AAM\s+/i, '')
    .replace(/^AAM\s+/i, '')
    .replaceAll(/Da_wah/gi, "Da'wah")
    .replaceAll(/Khosrow_s/gi, "Khosrow's")
    .replaceAll(/\s+/g, ' ')
    .trim();
};

const toCardSubtitle = (idPrefix: string): string => {
  if (idPrefix === 'pamphlet') {
    return 'Pamphlet resource';
  }
  if (idPrefix === 'scientific-poster') {
    return 'Scientific poster resource';
  }
  if (idPrefix === 'prophecy-poster') {
    return 'Prophecy poster resource';
  }
  return 'Downloadable PDF resource';
};

const buildDriveViewUrl = (fileId: string): string => {
  return `https://drive.google.com/file/d/${fileId}/view`;
};

const buildDriveDownloadUrl = (fileId: string): string => {
  return `https://drive.google.com/uc?export=download&id=${fileId}`;
};

const buildDriveThumbnailUrl = (fileId: string): string => {
  return `https://drive.google.com/thumbnail?id=${fileId}&sz=w1200`;
};

const buildDriveThumbnailCandidates = (fileId: string): readonly string[] => {
  const candidates = [
    buildDriveThumbnailUrl(fileId),
    `https://drive.google.com/thumbnail?authuser=0&id=${fileId}&sz=w1200`,
    `https://drive.googleusercontent.com/thumbnail?id=${fileId}&sz=w1200`,
    `https://lh3.googleusercontent.com/d/${fileId}=w1200`,
  ];
  return [...new Set(candidates)];
};

const buildPdfCards = (
  idPrefix: string,
  folderSegments: readonly string[],
  fileNames: readonly string[],
): readonly ResourceCard[] => {
  return fileNames.map((fileName, index) => {
    const encodedAssetPath = toAssetPath([...folderSegments, fileName]);
    const localPdfUrl = `/${encodedAssetPath}`;
    const driveFileId = driveFileIdsByAssetPath[encodedAssetPath];
    const articleUrl = driveFileId ? buildDriveViewUrl(driveFileId) : localPdfUrl;
    const downloadUrl = driveFileId ? buildDriveDownloadUrl(driveFileId) : localPdfUrl;
    const thumbnailUrls = driveFileId
      ? buildDriveThumbnailCandidates(driveFileId)
      : [cardThumbnailFallback];
    const thumbnailUrl = thumbnailUrls[0] ?? cardThumbnailFallback;
    const title = toDisplayTitle(fileName);
    const subtitle = toCardSubtitle(idPrefix);
    const articleId = idPrefix === 'pamphlet'
      ? getPamphletArticleId(title)
      : undefined;

    return {
      id: `${idPrefix}-${index + 1}`,
      title,
      articleUrl,
      subtitle,
      articleId,
      downloadUrl,
      thumbnailUrl,
      thumbnailUrls,
      thumbnailAlt: `${title} thumbnail`,
      driveFileId,
    };
  });
};

/**
 * Maps each pamphlet display title to its matching Q&A article ID.
 * The question text of each Q&A is set up to directly correspond to the topic
 * of the pamphlet so that "Read Article" always opens the relevant Q&A page.
 */
const getPamphletArticleId = (displayTitle: string): string | undefined => {
  const map: Readonly<Record<string, string>> = {
    'Truth': '04941fd7-b369-4e8a-d7c4-08de7962a21d',
    'Science': '4bc0851e-b42d-4416-d7c5-08de7962a21d',
    'Prophecy': '6c463f2b-b07e-4bcd-d7c6-08de7962a21d',
    'Foretold': 'f6af4c61-1f17-4336-d7c7-08de7962a21d',
    'Jesus': '2ac25076-8d77-4c64-d7c8-08de7962a21d',
    'Prophet Muhammad': '59f41efa-e0c1-4da5-d7c9-08de7962a21d',
    'Misconceptions': '414818d8-6405-45e6-d7cb-08de7962a21d',
    'Women': 'c63be535-d7c4-4cf4-d7ca-08de7962a21d',
    "Da'wah": '4f3d0e0b-95ea-4efb-d7cc-08de7962a21d',
  };

  const key = displayTitle.replace(/\s*Pamphlet$/i, '').trim();
  return map[key];
};

const pamphletCards = buildPdfCards(
  'pamphlet',
  ['resources', 'pamphlets', 'AAM Pamphlets'],
  pamphletPdfFiles,
);

const scientificPosterCards = buildPdfCards(
  'scientific-poster',
  ['resources', 'scientific-posters', 'PDF Versions'],
  scientificPosterPdfFiles,
);

const prophecyPosterCards = buildPdfCards(
  'prophecy-poster',
  ['resources', 'prophecy-posters', 'PDF Versions'],
  prophecyPosterPdfFiles,
);

const dawahResourceCards: readonly ResourceCard[] = [
  {
    id: 'dawah-knowledge-hub',
    title: 'Knowledge Hub',
    subtitle: 'Curated materials for learning and research',
    articleUrl: 'https://drive.google.com/drive/folders/1b8-rR45DccoGUqmFiZ0qTiBuANSQTSUf',
    downloadUrl: 'https://drive.google.com/drive/folders/1b8-rR45DccoGUqmFiZ0qTiBuANSQTSUf',
    thumbnailUrl: cardThumbnailFallback,
    thumbnailAlt: 'Knowledge Hub resource',
  },
  {
    id: 'dawah-101',
    title: "Da'wah 101",
    subtitle: 'A quick starter for Da’wah',
    articleUrl: 'https://www.youtube.com/watch?v=YPnwAgbgrus',
    downloadUrl: 'https://www.youtube.com/watch?v=YPnwAgbgrus',
    thumbnailUrl: cardThumbnailFallback,
    thumbnailAlt: "Da'wah 101 resource",
  },
];

const galleries: readonly ResourceGallery[] = [
  {
    id: 'gallery-1',
    eyebrow: 'Seek. Learn. Understand.',
    title: 'Ask A Muslim Resources',
    surface: 'base',
    tabs: [
      { id: 'pamphlets', label: 'Pamphlets' },
      { id: 'scientific-posters', label: 'Scientific Posters' },
      { id: 'prophecy-posters', label: 'Prophecy Posters' },
    ],
    cardsByTab: {
      pamphlets: pamphletCards,
      'scientific-posters': scientificPosterCards,
      'prophecy-posters': prophecyPosterCards,
    },
  },
  {
    id: 'gallery-2',
    eyebrow: "Learn How To Give Da'wah",
    title: 'Da’wah Resources',
    surface: 'surface',
    tabs: [
      { id: 'dawah-resources', label: 'Dawah Resources' },
    ],
    cardsByTab: {
      'dawah-resources': dawahResourceCards,
    },
  },
];

const newMuslimCards: readonly NewMuslimCard[] = [
  {
    id: 'wudu',
    title: 'How to Perform Ablution (Wudu)',
    subtitle: 'Step-by-step learning journey from ignorance to knowledge.',
    url: 'https://m.youtube.com/watch?v=2xS70Zn-jRk&pp=ygUgaG93IHRvIGRvIHd1ZHUgZ3JlZW4gbGFuZSBtYXNqaWQ%3D',
  },
  {
    id: 'prayer',
    title: 'How to Pray',
    subtitle: 'Step-by-step learning journey from ignorance to knowledge.',
    url: 'https://m.youtube.com/watch?v=4zr6tNgmKSI&pp=ygUjSG93IHRvIFByYXkgSXNsYW0gZ3JlZW4gbGFuZSBNYXNqaWQ%3D',
  },
  {
    id: 'guidebook',
    title: 'New Muslim Guide Book',
    subtitle: 'Step-by-step learning journey from ignorance to knowledge.',
    url: 'https://drive.google.com/file/d/1jp6YkciKa24wu34XxdHxt6v2EkzzceiR/view?usp=drivesdk',
  },
  {
    id: 'daily-dua',
    title: 'New Muslim Form',
    subtitle: 'Step-by-step learning journey from ignorance to knowledge.',
    url: 'https://www.noorohio.org/newmuslims/',
  },
];

export const resourcesResolver: ResolveFn<ResourcesResolvedData | null> = () => {
  return of({
    galleries,
    newMuslimCards,
  });
};
