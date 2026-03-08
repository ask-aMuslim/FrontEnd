import { CommonModule } from '@angular/common';
import { Component, computed, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

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

interface ResourceGallery {
    readonly id: 'gallery-1' | 'gallery-2';
    readonly title: string;
    readonly surface: 'base' | 'surface';
    readonly tabs: readonly ResourceTab[];
    readonly cardsByTab: Readonly<Record<string, readonly ResourceCard[]>>;
}

interface NewMuslimCard {
    readonly id: string;
    readonly title: string;
    readonly subtitle: string;
    readonly column: 'half' | 'full';
}

@Component({
    selector: 'app-resources-page',
    standalone: true,
    imports: [CommonModule, RouterLink],
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
            title: 'Featured resources',
            surface: 'base',
            tabs: [
                { id: 'pamphlets', label: 'Pamphlets', hasIndicator: false },
                { id: 'scientific-posters', label: 'Scientific Posters', hasIndicator: false },
                { id: 'prophecy-posters', label: 'Prophecy Posters', hasIndicator: false },
            ],
            cardsByTab: {
                pamphlets: this.sharedResourceCards,
                'scientific-posters': this.sharedResourceCards,
                'prophecy-posters': this.sharedResourceCards,
            },
        },
        {
            id: 'gallery-2',
            title: 'More resources',
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

    protected readonly newMuslimCards: readonly NewMuslimCard[] = [
        {
            id: 'wudu',
            title: 'How to Perform Ablution (Wudu)',
            subtitle: 'Step-by-step learning journey from ignorance to knowledge.',
            column: 'half',
        },
        {
            id: 'prayer',
            title: 'How to Pray',
            subtitle: 'Step-by-step learning journey from ignorance to knowledge.',
            column: 'half',
        },
        {
            id: 'guidebook',
            title: 'New Muslim Guide Book',
            subtitle: 'Step-by-step learning journey from ignorance to knowledge.',
            column: 'full',
        },
    ];

    private readonly activeTabsByGallery = signal<Record<ResourceGallery['id'], string>>({
        'gallery-1': 'pamphlets',
        'gallery-2': 'common-allegations',
    });

    // used to add/remove animation class when tabs change
    protected readonly animationClasses = signal<Record<ResourceGallery['id'], boolean>>({
        'gallery-1': true,
        'gallery-2': true,
    });

    protected readonly visibleCardsByGallery = computed(() => {
        const activeTabs = this.activeTabsByGallery();
        const next: Record<ResourceGallery['id'], readonly ResourceCard[]> = {
            'gallery-1': this.sharedResourceCards,
            'gallery-2': this.sharedResourceCards,
        };

        for (const gallery of this.galleries) {
            const activeTabId = activeTabs[gallery.id];
            const fallbackTabId = gallery.tabs[0]?.id;
            const selectedTabId = activeTabId ?? fallbackTabId;
            next[gallery.id] = gallery.cardsByTab[selectedTabId] ?? this.sharedResourceCards;
        }

        return next;
    });

    protected selectGalleryTab(galleryId: ResourceGallery['id'], tabId: string): void {
        // trigger fade animation by toggling flag off then on
        this.animationClasses.update((c) => ({ ...c, [galleryId]: false }));
        this.activeTabsByGallery.update((current) => ({
            ...current,
            [galleryId]: tabId,
        }));
        // schedule class re-add in next tick so animation plays
        setTimeout(() => {
            this.animationClasses.update((c) => ({ ...c, [galleryId]: true }));
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

    protected isGalleryTabActive(galleryId: ResourceGallery['id'], tabId: string): boolean {
        return this.activeTabsByGallery()[galleryId] === tabId;
    }

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
}
