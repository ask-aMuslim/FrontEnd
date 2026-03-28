import { CommonModule } from '@angular/common';
import { Component, computed, signal } from '@angular/core';

interface ResourceCard {
    readonly id: string;
    readonly title: string;
    readonly subtitle: string;
    readonly imageSrc: string;
    readonly imageAlt: string;
}

interface ResourceTab {
    readonly id: string;
    readonly label: string;
    readonly hasIndicator: boolean;
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
    protected readonly hero = {
        eyebrowPrimary: 'About',
        eyebrowSecondary: 'Guidance',
        title: 'Learn More About Islam',
        subtitle: 'Here are some helpful resources you can browse',
        ctaLabel: 'Want to Accept Islam?',
    } as const;

    private readonly sharedResourceCards: readonly ResourceCard[] = [
        {
            id: 'science-quran-1',
            title: 'Science in the Quran',
            subtitle: 'A miracle of Islam',
            imageSrc: '/images/channel1.png',
            imageAlt: 'Science in the Quran resource cover',
        },
        {
            id: 'science-quran-2',
            title: 'Science in the Quran',
            subtitle: 'A miracle of Islam',
            imageSrc: '/images/channel2.png',
            imageAlt: 'Scientific resource cover preview',
        },
        {
            id: 'science-quran-3',
            title: 'Science in the Quran',
            subtitle: 'A miracle of Islam',
            imageSrc: '/images/channel3.png',
            imageAlt: 'Prophecy resource cover preview',
        },
    ];

    protected readonly galleries: readonly ResourceGallery[] = [
        {
            id: 'gallery-1',
            surface: 'base',
            tabs: [
                { id: 'pamphlets', label: 'Pamphlets', hasIndicator: true },
                { id: 'scientific-posters', label: 'Scientific Posters', hasIndicator: true },
                { id: 'prophecy-posters', label: 'Prophecy Posters', hasIndicator: true },
            ],
            cardsByTab: {
                pamphlets: this.sharedResourceCards,
                'scientific-posters': this.sharedResourceCards,
                'prophecy-posters': this.sharedResourceCards,
            },
        },
        {
            id: 'gallery-2',
            eyebrow: 'For Studies',
            title: 'Da’wah Resources',
            surface: 'surface',
            tabs: [
                { id: 'common-allegations', label: 'Common Allegations', hasIndicator: true },
                { id: 'dawah-materials', label: 'Dawah Materials', hasIndicator: true },
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

    protected readonly visibleCardsByGallery = computed(() => {
        const activeTabs = this.activeTabsByGallery();
        const next: Record<ResourceGalleryId, readonly ResourceCard[]> = {
            'gallery-1': this.sharedResourceCards,
            'gallery-2': this.sharedResourceCards,
        };

        for (const gallery of this.galleries) {
            const selectedTab = activeTabs[gallery.id] ?? gallery.tabs[0]?.id;
            next[gallery.id] = gallery.cardsByTab[selectedTab] ?? this.sharedResourceCards;
        }

        return next;
    });

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

    protected trackByGalleryId(_index: number, gallery: ResourceGallery): string {
        return gallery.id;
    }

    protected trackByTabId(_index: number, tab: ResourceTab): string {
        return tab.id;
    }

    protected trackByCardId(_index: number, card: ResourceCard): string {
        return card.id;
    }

    protected trackByNewMuslimCardId(_index: number, card: NewMuslimCard): string {
        return card.id;
    }

    protected selectGalleryTab(galleryId: ResourceGalleryId, tabId: string): void {
        this.activeTabsByGallery.update((current) => ({
            ...current,
            [galleryId]: tabId,
        }));
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
}
