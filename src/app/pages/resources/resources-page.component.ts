import { CommonModule } from '@angular/common';
import { Component, signal } from '@angular/core';

interface ResourceCard {
    readonly id: string;
    readonly title: string;
    readonly subtitle: string;
    readonly imageSrc: string;
    readonly imageAlt: string;
    readonly articleUrl: string;
    readonly downloadUrl: string;
    readonly downloadFileName: string;
    readonly showReadArticle: boolean;
    readonly driveFileId?: string;
    readonly thumbnailRetryUrl?: string;
}

interface ResourceTab {
    readonly id: string;
    readonly label: string;
}

type ResourceGalleryId = 'gallery-1' | 'gallery-2';

interface ResourceGallery {
    readonly id: ResourceGalleryId;
    readonly eyebrow?: string;
    readonly title?: string;
    readonly surface: 'base' | 'surface';
    readonly tabs: readonly ResourceTab[];
    readonly cardsByTab: Readonly<Record<string, readonly ResourceCard[]>>;
}

interface NewMuslimCard {
    readonly id: string;
    readonly title: string;
    readonly subtitle: string;
}

@Component({
    selector: 'app-resources-page',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './resources-page.component.html',
    styleUrl: './resources-page.component.scss',
})
export class ResourcesPageComponent {
    private readonly itemsPerLoad = 3;
    protected readonly hero = {
        eyebrowPrimary: 'About',
        eyebrowSecondary: 'Guidance',
        title: 'Learn More About Islam',
        subtitle: 'Here are some helpful resources you can browse',
        ctaLabel: 'Want to Accept Islam?',
    } as const;

    protected readonly thumbnailFallbackImage = '/ask-a-muslim-logo.png';

    private readonly fallbackResourceImage = '/images/channel1.png';

    private readonly driveFileIdsByAssetPath: Readonly<Record<string, string>> = {
        // Pamphlets
        "resources/pamphlets/AAM%20Pamphlets/Finalized%20289x214mm%20AAM%20Da'wah%20Pamphlet.pdf":
            '1bSeiFM4Bbl7sYIxprDF__s0QHpvu6PLd',
        'resources/pamphlets/AAM%20Pamphlets/Finalized%20289x214mm%20AAM%20Foretold%20Pamphlet.pdf':
            '1vmRjYvUJUc-9Dmy-3knRxUTKA8HYKV6y',
        'resources/pamphlets/AAM%20Pamphlets/Finalized%20289x214mm%20AAM%20Jesus%20Pamphlet.pdf':
            '1wzV8c_yBcQiwGnEMDo-IkV7QprZeQSqU',
        'resources/pamphlets/AAM%20Pamphlets/Finalized%20289x214mm%20AAM%20Misconceptions%20Pamphlet.pdf':
            '1Y3qwk_P7CwEw2MP1R74qQfig6P0Lcttk',
        'resources/pamphlets/AAM%20Pamphlets/Finalized%20289x214mm%20AAM%20Prophecy%20Pamphlet.pdf':
            '1zTRYhfEmQpqSxKGCviW8iIFROAikXIoP',
        'resources/pamphlets/AAM%20Pamphlets/Finalized%20289x214mm%20AAM%20Prophet%20Muhammad%20Pamphlet.pdf':
            '1BZLVdsbWe2M0PXEZeqpmc3XnJ-yjUM8O',
        'resources/pamphlets/AAM%20Pamphlets/Finalized%20289x214mm%20AAM%20Science%20Pamphlet.pdf':
            '1LkaZlsCFuppXH95y4lwNVLJzvU-RfSoi',
        'resources/pamphlets/AAM%20Pamphlets/Finalized%20289x214mm%20AAM%20Truth%20Pamphlet.pdf':
            '1lJj8FtryOh9BxM8Ur6jpmoNijh5fiNDa',
        'resources/pamphlets/AAM%20Pamphlets/Finalized%20289x214mm%20AAM%20Women%20Pamphlet.pdf':
            '1QzavhMdPGN2OpIw54ANr9ldX-AennZEo',

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
        'resources/scientific-posters/PDF%20Versions/AAM%20Iron%20is%20not%20from%20the%20Earth.pdf':
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

    private readonly driveLinksByAssetPath: Readonly<Record<string, string>> = {
        // Optional override map: '<encoded asset path>' -> '<direct URL>'
        // Example:
        // 'resources/scientific-posters/PDF%20Versions/AAM%20Big%20Bang%20in%20the%20Quran.pdf': 'https://drive.google.com/file/d/.../view'
    };

    private readonly pamphletPdfFiles: readonly string[] = [
        "Finalized 289x214mm AAM Da'wah Pamphlet.pdf",
        'Finalized 289x214mm AAM Foretold Pamphlet.pdf',
        'Finalized 289x214mm AAM Jesus Pamphlet.pdf',
        'Finalized 289x214mm AAM Misconceptions Pamphlet.pdf',
        'Finalized 289x214mm AAM Prophecy Pamphlet.pdf',
        'Finalized 289x214mm AAM Prophet Muhammad Pamphlet.pdf',
        'Finalized 289x214mm AAM Science Pamphlet.pdf',
        'Finalized 289x214mm AAM Truth Pamphlet.pdf',
        'Finalized 289x214mm AAM Women Pamphlet.pdf',
    ];

    private readonly scientificPosterPdfFiles: readonly string[] = [
        'AAM Atmosphere Protects Humans on Earth .pdf',
        'AAM Big Bang in the Quran.pdf',
        'AAM Expansion of The Universe.pdf',
        'AAM Heavy Clouds.pdf',
        'AAM Human Embrology.pdf',
        'AAM Iron is not from the Earth.pdf',
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

    private readonly prophecyPosterPdfFiles: readonly string[] = [
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

    private readonly pamphletCards: readonly ResourceCard[] = this.buildPdfCards(
        'pamphlet',
        ['resources', 'pamphlets', 'AAM Pamphlets'],
        this.pamphletPdfFiles,
        'Pamphlet',
        true,
    );

    private readonly scientificPosterCards: readonly ResourceCard[] = this.buildPdfCards(
        'scientific-poster',
        ['resources', 'scientific-posters', 'PDF Versions'],
        this.scientificPosterPdfFiles,
        'Scientific Poster',
        false,
    );

    private readonly prophecyPosterCards: readonly ResourceCard[] = this.buildPdfCards(
        'prophecy-poster',
        ['resources', 'prophecy-posters', 'PDF Versions'],
        this.prophecyPosterPdfFiles,
        'Prophecy Poster',
        false,
    );

    private readonly sharedResourceCards: readonly ResourceCard[] = [
        {
            id: 'science-quran-1',
            title: 'Science in the Quran',
            subtitle: 'A miracle of Islam',
            imageSrc: '/images/channel1.png',
            imageAlt: 'Science in the Quran resource cover',
            articleUrl: '/resources',
            downloadUrl: '/resources',
            downloadFileName: 'science-in-the-quran.pdf',
            showReadArticle: true,
        },
        {
            id: 'science-quran-2',
            title: 'Science in the Quran',
            subtitle: 'A miracle of Islam',
            imageSrc: '/images/channel2.png',
            imageAlt: 'Scientific resource cover preview',
            articleUrl: '/resources',
            downloadUrl: '/resources',
            downloadFileName: 'science-in-the-quran.pdf',
            showReadArticle: true,
        },
        {
            id: 'science-quran-3',
            title: 'Science in the Quran',
            subtitle: 'A miracle of Islam',
            imageSrc: '/images/channel3.png',
            imageAlt: 'Prophecy resource cover preview',
            articleUrl: '/resources',
            downloadUrl: '/resources',
            downloadFileName: 'science-in-the-quran.pdf',
            showReadArticle: true,
        },
    ];

    protected readonly galleries: readonly ResourceGallery[] = [
        {
            id: 'gallery-1',
            surface: 'base',
            tabs: [
                { id: 'pamphlets', label: 'Pamphlets' },
                { id: 'scientific-posters', label: 'Scientific Posters' },
                { id: 'prophecy-posters', label: 'Prophecy Posters' },
            ],
            cardsByTab: {
                pamphlets: this.pamphletCards,
                'scientific-posters': this.scientificPosterCards,
                'prophecy-posters': this.prophecyPosterCards,
            },
        },
        {
            id: 'gallery-2',
            eyebrow: 'For Studies',
            title: 'Da’wah Resources',
            surface: 'surface',
            tabs: [
                { id: 'common-allegations', label: 'Common Allegations' },
                { id: 'dawah-materials', label: 'Dawah Materials' },
            ],
            cardsByTab: {
                'common-allegations': this.sharedResourceCards,
                'dawah-materials': this.sharedResourceCards,
            },
        },
    ];

    private readonly activeTabsByGallery = signal<Record<ResourceGalleryId, string>>({
        'gallery-1': 'pamphlets',
        'gallery-2': 'common-allegations',
    });

    private readonly visibleCountByTabKey = signal<Record<string, number>>({
        'gallery-1:pamphlets': this.itemsPerLoad,
        'gallery-1:scientific-posters': this.itemsPerLoad,
        'gallery-1:prophecy-posters': this.itemsPerLoad,
        'gallery-2:common-allegations': this.itemsPerLoad,
        'gallery-2:dawah-materials': this.itemsPerLoad,
    });

    private readonly thumbnailFallbackByCardId = signal<Record<string, boolean>>({});

    protected readonly resourcesCta = {
        title: 'Do You Have Any Questions?',
        subtitle:
            'No question is too small or too complex. If you’re curious about Islam, want clarification about something you’ve heard, or would like to learn directly from Muslims, we’re here to help.',
        requestQuranLabel: 'Request Free Quran',
        askQuestionLabel: 'Ask a Question',
        requestQuranUrl: 'https://www.onemessagefoundation.com/free-quran',
        askQuestionUrl: '/ask-and-contact',
    } as const;

    protected readonly newMuslimCards: readonly NewMuslimCard[] = [
        {
            id: 'wudu',
            title: 'How to Perform Ablution (Wudu)',
            subtitle: 'Step-by-step learning journey from ignorance to knowledge.',
        },
        {
            id: 'prayer',
            title: 'How to Pray',
            subtitle: 'Step-by-step learning journey from ignorance to knowledge.',
        },
        {
            id: 'guidebook',
            title: 'New Muslim Guide Book',
            subtitle: 'Step-by-step learning journey from ignorance to knowledge.',
        },
        {
            id: 'daily-dua',
            title: 'Daily Duas for New Muslims',
            subtitle: 'Step-by-step learning journey from ignorance to knowledge.',
        },
    ];

    protected selectGalleryTab(galleryId: ResourceGalleryId, tabId: string): void {
        const tabKey = this.buildTabKey(galleryId, tabId);
        this.activeTabsByGallery.update((current) => ({
            ...current,
            [galleryId]: tabId,
        }));
        this.visibleCountByTabKey.update((current) => {
            if (current[tabKey] !== undefined) {
                return current;
            }
            return {
                ...current,
                [tabKey]: this.itemsPerLoad,
            };
        });
    }

    protected onGalleryTabKeydown(
        event: KeyboardEvent,
        gallery: ResourceGallery,
        currentTabId: string,
    ): void {
        const tabIds = gallery.tabs.map((tab) => tab.id);
        const currentIndex = tabIds.indexOf(currentTabId);
        if (currentIndex === -1 || tabIds.length === 0) {
            return;
        }
        let nextIndex = currentIndex;

        switch (event.key) {
            case 'ArrowRight':
            case 'ArrowDown':
                nextIndex = (currentIndex + 1) % tabIds.length;
                break;
            case 'ArrowLeft':
            case 'ArrowUp':
                nextIndex = (currentIndex - 1 + tabIds.length) % tabIds.length;
                break;
            case 'Home':
                nextIndex = 0;
                break;
            case 'End':
                nextIndex = tabIds.length - 1;
                break;
            default:
                return;
        }

        event.preventDefault();
        this.selectGalleryTab(gallery.id, tabIds[nextIndex]);
    }

    protected isGalleryTabActive(galleryId: ResourceGalleryId, tabId: string): boolean {
        return this.activeTabsByGallery()[galleryId] === tabId;
    }

    protected getVisibleCards(gallery: ResourceGallery): readonly ResourceCard[] {
        const selectedTab = this.getSelectedTabId(gallery);
        const tabCards = gallery.cardsByTab[selectedTab] ?? [];
        const tabKey = this.buildTabKey(gallery.id, selectedTab);
        const visibleCount = this.visibleCountByTabKey()[tabKey] ?? this.itemsPerLoad;
        return tabCards.slice(0, visibleCount);
    }

    protected canLoadMore(gallery: ResourceGallery): boolean {
        const selectedTab = this.getSelectedTabId(gallery);
        const tabCards = gallery.cardsByTab[selectedTab] ?? [];
        const tabKey = this.buildTabKey(gallery.id, selectedTab);
        const visibleCount = this.visibleCountByTabKey()[tabKey] ?? this.itemsPerLoad;
        return visibleCount < tabCards.length;
    }

    protected showMore(gallery: ResourceGallery): void {
        const selectedTab = this.getSelectedTabId(gallery);
        const tabCards = gallery.cardsByTab[selectedTab] ?? [];
        const tabKey = this.buildTabKey(gallery.id, selectedTab);
        this.visibleCountByTabKey.update((current) => {
            const currentCount = current[tabKey] ?? this.itemsPerLoad;
            return {
                ...current,
                [tabKey]: Math.min(currentCount + this.itemsPerLoad, tabCards.length),
            };
        });
    }

    protected isThumbnailFallback(cardId: string): boolean {
        return this.thumbnailFallbackByCardId()[cardId] === true;
    }

    protected onResourceThumbnailError(event: Event, card: ResourceCard): void {
        const image = event.target as HTMLImageElement | null;
        if (!image) {
            return;
        }

        const hasRetried = image.dataset['retry'] === '1';
        if (!hasRetried && card.thumbnailRetryUrl) {
            image.dataset['retry'] = '1';
            image.src = card.thumbnailRetryUrl;
            return;
        }

        this.thumbnailFallbackByCardId.update((current) => ({
            ...current,
            [card.id]: true,
        }));
    }

    private buildPdfCards(
        idPrefix: string,
        folderSegments: readonly string[],
        fileNames: readonly string[],
        subtitle: string,
        showReadArticle: boolean,
    ): readonly ResourceCard[] {
        return fileNames.map((fileName, index) => {
            const encodedAssetPath = this.toAssetPath([...folderSegments, fileName]);
            const localPdfUrl = `/${encodedAssetPath}`;
            const driveFileId = this.driveFileIdsByAssetPath[encodedAssetPath];
            const directDriveUrl = this.driveLinksByAssetPath[encodedAssetPath];
            const articleUrl = directDriveUrl
                ?? (driveFileId ? this.buildDriveViewUrl(driveFileId) : localPdfUrl);
            const downloadUrl = driveFileId
                ? this.buildDriveDownloadUrl(driveFileId)
                : (directDriveUrl ?? localPdfUrl);
            const imageSrc = driveFileId
                ? this.buildDriveThumbnailUrl(driveFileId)
                : this.fallbackResourceImage;
            const thumbnailRetryUrl = driveFileId
                ? this.buildDriveThumbnailRetryUrl(driveFileId)
                : undefined;
            const title = this.toDisplayTitle(fileName);

            return {
                id: `${idPrefix}-${index + 1}`,
                title,
                subtitle,
                imageSrc,
                imageAlt: `${title} PDF preview`,
                articleUrl,
                downloadUrl,
                downloadFileName: fileName,
                showReadArticle,
                driveFileId,
                thumbnailRetryUrl,
            };
        });
    }

    private buildDriveViewUrl(fileId: string): string {
        return `https://drive.google.com/file/d/${fileId}/view`;
    }

    private buildDriveDownloadUrl(fileId: string): string {
        return `https://drive.google.com/uc?export=download&id=${fileId}`;
    }

    private buildDriveThumbnailUrl(fileId: string): string {
        return `https://drive.google.com/thumbnail?id=${fileId}&sz=w1200`;
    }

    private buildDriveThumbnailRetryUrl(fileId: string): string {
        return `https://drive.google.com/thumbnail?id=${fileId}&sz=w1200&v=${Date.now()}`;
    }

    private getSelectedTabId(gallery: ResourceGallery): string {
        return this.activeTabsByGallery()[gallery.id] ?? gallery.tabs[0]?.id ?? '';
    }

    private buildTabKey(galleryId: ResourceGalleryId, tabId: string): string {
        return `${galleryId}:${tabId}`;
    }

    private toAssetPath(pathSegments: readonly string[]): string {
        return pathSegments.map((segment) => encodeURIComponent(segment)).join('/');
    }

    private toDisplayTitle(fileName: string): string {
        return fileName
            .replace(/\.pdf$/i, '')
            .replace(/^Finalized\s+289x214mm\s+AAM\s+/i, '')
            .replace(/^AAM\s+/i, '')
            .replaceAll(/Da_wah/gi, "Da'wah")
            .replaceAll(/Khosrow_s/gi, "Khosrow's")
            .replaceAll(/\s+/g, ' ')
            .trim();
    }
}
