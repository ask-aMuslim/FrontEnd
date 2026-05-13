import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { AuthService } from '../../core/services/auth.service';

interface TimelineItem {
    year: string;
    description: string;
}

interface AudienceCard {
    title: string;
    description: string;
    variant?: 'light' | 'white';
    topicTag: string;
}

interface AchievementStat {
    value: string;
    label: string;
    icon: string;
}

interface AchievementHighlight {
    text: string;
}

@Component({
    selector: 'app-about',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './about.component.html',
    styleUrl: './about.component.scss',
})
export class AboutComponent {
    protected readonly authService = inject(AuthService);

    protected readonly aboutQuestionsCta = {
        title: 'Do You Have Any Questions?',
        subtitle:
            'No question is too small or too complex. If you’re curious about Islam, want clarification about something you’ve heard, or would like to learn directly from Muslims, we’re here to help.',
        requestQuranLabel: 'Request Free Quran',
        askQuestionLabel: 'Ask a Question',
        requestQuranUrl: 'https://www.onemessagefoundation.com/free-quran',
        askQuestionUrl: '/question-and-answer/topics',
    } as const;

    protected readonly timelineItems: readonly TimelineItem[] = [
        {
            year: '2013',
            description: 'Founded in Ohio as a local community outreach program.',
        },
        {
            year: '2016',
            description: 'Expanded weekly dawah tables to 5 major universities.',
        },
        {
            year: 'Present',
            description: 'Reaching millions globally with National Dawah Academies.',
        },
    ];

    protected readonly audienceCards: readonly AudienceCard[] = [
        {
            title: 'I’m a Christian',
            description: 'Step-by-step learning journey from ignorance to knowledge.',
            variant: 'light',
            topicTag: 'Christianity',
        },
        {
            title: 'I’m a Jew',
            description: 'Step-by-step learning journey from ignorance to knowledge.',
            variant: 'white',
            topicTag: 'Judaism',
        },
        {
            title: 'I’m a Polytheist',
            description: 'Step-by-step learning journey from ignorance to knowledge.',
            variant: 'light',
            topicTag: 'Polytheism',
        },
        {
            title: 'I’m an Atheist',
            description: 'Step-by-step learning journey from ignorance to knowledge.',
            variant: 'white',
            topicTag: 'Atheism',
        },
        {
            title: 'I’m an Agnostic',
            description: 'Step-by-step learning journey from ignorance to knowledge.',
            variant: 'light',
            topicTag: 'General',
        },
        {
            title: 'I’m a New Muslim',
            description: 'Step-by-step learning journey from ignorance to knowledge.',
            variant: 'light',
            topicTag: 'General',
        },
        {
            title: 'I’m a Born Muslim',
            description: 'Step-by-step learning journey from ignorance to knowledge.',
            variant: 'white',
            topicTag: 'General',
        },
        {
            title: 'I’m a Seeker',
            description: 'Step-by-step learning journey from ignorance to knowledge.',
            variant: 'white',
            topicTag: 'General',
        },
        {
            title: 'I’m a Woman',
            description: 'Step-by-step learning journey from ignorance to knowledge.',
            variant: 'light',
            topicTag: 'Women',
        },
    ];

    protected readonly achievementStats: readonly AchievementStat[] = [
        {
            value: '6,000+',
            label: 'Shahadas witnessed',
            icon: '/icons/icons-24/done.svg',
        },
        {
            value: '10,000+',
            label: 'English Qurans distributed',
            icon: '/icons/icons-24/articles.svg',
        },
        {
            value: '6,000+',
            label: 'Dawah pamphlets published',
            icon: '/icons/icons-24/video-file.svg',
        },
        {
            value: '6,000+',
            label: "Da'ees trained",
            icon: '/icons/icons-24/profile-two-user.svg',
        },
        {
            value: '3M+',
            label: 'Social media followers',
            icon: '/icons/icons-24/channel.svg',
        },
        {
            value: '300K+',
            label: 'Billboard viewers weekly',
            icon: '/icons/icons-24/eye.svg',
        },
    ];

    protected readonly achievementHighlights: readonly AchievementHighlight[] = [
        { text: 'Established weekly Dawah tables at university campuses.' },
        { text: 'Facilitated comprehensive Dawah workshops for masajid.' },
        { text: 'Delivered live educational programs through our Academy.' },
        { text: 'Hosted weekly Youth and Adult Halaqas to foster understanding.' },
        { text: 'Provided monthly food assistance to hundreds of families.' },
        { text: 'Maintained billboards reaching 300,000 viewers weekly.' },
        { text: 'Distributed 80,000 bumper stickers across multiple states.' },
        { text: 'Initiated National Dawah Academies.' },
        { text: 'Featured in local and national media.' },
    ];

    protected trackByYear(_index: number, item: TimelineItem): string {
        return item.year;
    }

    protected trackByAudienceTitle(_index: number, item: AudienceCard): string {
        return item.title;
    }

    protected isOddAudienceCard(index: number): boolean {
        return (index + 1) % 2 === 1;
    }

    protected getAudienceCardHref(item: AudienceCard): string {
        return `/question-and-answer/topics?category=${encodeURIComponent(item.topicTag)}`;
    }

    protected trackByStatLabel(_index: number, item: AchievementStat): string {
        return item.label;
    }

    protected trackByHighlightText(_index: number, item: AchievementHighlight): string {
        return item.text;
    }
}
