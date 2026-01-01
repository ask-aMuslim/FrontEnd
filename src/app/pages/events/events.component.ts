import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EventCardComponent } from './event-card/event-card.component';
import type { EventCard } from './event-card/event-card.component';

@Component({
  selector: 'app-events',
  imports: [EventCardComponent, CommonModule],
  templateUrl: './events.component.html',
  styleUrl: './events.component.scss',
})
export class EventsComponent {
  currentPage = 1;
  itemsPerPage = 6;
  pages: number[] = [];

  eventCards: EventCard[] = [
    {
      id: 1,
      title: 'Understanding Prayer: A Practical Guide',
      description:
        'Learn the fundamentals of Islamic prayer with step-by-step guidance from experienced instructors.',
      imageUrl: '/images/events-picture-original.png',
      imageAlt: 'Prayer Guide',
      speakerName: 'Sheikh Uthman Farooq',
      speakerImage: '/images/events-picture-original.png',
      speakerRole: 'Islamic Scholar',
      date: '12 Dec, 2025',
      tags: ['#Prayer', '#Islamic', '#Practical', '#Beginner'],
      isRecorded: true,
    },
    {
      id: 2,
      title: 'Islamic Ethics in Modern Society',
      description:
        'Explore ethical principles in Islam and their application in contemporary times.',
      imageUrl: '/images/events-picture-original.png',
      imageAlt: 'Islamic Ethics',
      speakerName: 'Dr. Fatima Hassan',
      speakerImage: '/images/events-picture-original.png',
      speakerRole: 'Islamic Ethicist',
      date: '15 Dec, 2025',
      tags: ['#Ethics', '#Modern', '#Islamic', '#Society'],
      isRecorded: false,
    },
    {
      id: 3,
      title: 'Quranic Interpretations and Meanings',
      description: 'Deep dive into understanding the Quran and its profound meanings.',
      imageUrl: '/images/events-picture-original.png',
      imageAlt: 'Quranic Studies',
      speakerName: 'Sheikh Muhammad Ali',
      speakerImage: '/images/events-picture-original.png',
      speakerRole: 'Quran Expert',
      date: '18 Dec, 2025',
      tags: ['#Quran', '#Tafsir', '#Islamic', '#Knowledge'],
      isRecorded: true,
    },
    {
      id: 4,
      title: 'Islamic History: From Prophet to Modern Era',
      description: 'Comprehensive overview of Islamic history and its major events.',
      imageUrl: '/images/events-picture-original.png',
      imageAlt: 'Islamic History',
      speakerName: 'Prof. Ahmed Ibrahim',
      speakerImage: '/images/events-picture-original.png',
      speakerRole: 'Islamic Historian',
      date: '20 Dec, 2025',
      tags: ['#History', '#Islamic', '#Heritage', '#Learning'],
      isRecorded: false,
    },
    {
      id: 5,
      title: 'Mental Health and Islamic Spirituality',
      description: 'Understanding the connection between mental health and Islamic teachings.',
      imageUrl: '/images/events-picture-original.png',
      imageAlt: 'Mental Health',
      speakerName: 'Dr. Aisha Khan',
      speakerImage: '/images/events-picture-original.png',
      speakerRole: 'Psychologist & Scholar',
      date: '22 Dec, 2025',
      tags: ['#MentalHealth', '#Spirituality', '#Wellness', '#Islamic'],
      isRecorded: false,
    },
    {
      id: 6,
      title: 'Family Relationships in Islam',
      description: 'Discover Islamic principles for building strong and harmonious families.',
      imageUrl: '/images/events-picture-original.png',
      imageAlt: 'Family',
      speakerName: 'Sheikh Yousef Abbas',
      speakerImage: '/images/events-picture-original.png',
      speakerRole: 'Family Counselor',
      date: '25 Dec, 2025',
      tags: ['#Family', '#Relationships', '#Islamic', '#Values'],
      isRecorded: true,
    },
    {
      id: 7,
      title: 'Islamic Finance and Economics',
      description: 'Learn about halal finance and Islamic economic principles.',
      imageUrl: '/images/events-picture-original.png',
      imageAlt: 'Finance',
      speakerName: 'Dr. Omar Hassan',
      speakerImage: '/images/events-picture-original.png',
      speakerRole: 'Finance Expert',
      date: '27 Dec, 2025',
      tags: ['#Finance', '#Economics', '#Islamic', '#Business'],
      isRecorded: false,
    },
    {
      id: 8,
      title: 'Women in Islam: Rights and Roles',
      description: 'Understanding the rights and contributions of women in Islamic society.',
      imageUrl: '/images/events-picture-original.png',
      imageAlt: 'Women in Islam',
      speakerName: 'Dr. Layla Ahmed',
      speakerImage: '/images/events-picture-original.png',
      speakerRole: 'Islamic Scholar',
      date: '28 Dec, 2025',
      tags: ['#Women', '#Rights', '#Islamic', '#Empowerment'],
      isRecorded: false,
    },
    {
      id: 9,
      title: 'The Islamic Art and Architecture',
      description: 'Explore the beauty and significance of Islamic art forms.',
      imageUrl: '/images/events-picture-original.png',
      imageAlt: 'Islamic Art',
      speakerName: 'Mr. Hassan Al-Rashid',
      speakerImage: '/images/events-picture-original.png',
      speakerRole: 'Art Historian',
      date: '29 Dec, 2025',
      tags: ['#Art', '#Architecture', '#Islamic', '#Culture'],
      isRecorded: true,
    },
    {
      id: 10,
      title: 'Youth and Islamic Identity',
      description: 'Guiding youth in understanding and maintaining their Islamic identity.',
      imageUrl: '/images/events-picture-original.png',
      imageAlt: 'Youth',
      speakerName: 'Brother Ali Rahman',
      speakerImage: '/images/events-picture-original.png',
      speakerRole: 'Youth Mentor',
      date: '30 Dec, 2025',
      tags: ['#Youth', '#Identity', '#Islamic', '#Development'],
      isRecorded: false,
    },
    {
      id: 11,
      title: 'Islamic Science and Technology',
      description: 'The role of science and technology in Islamic civilization.',
      imageUrl: '/images/events-picture-original.png',
      imageAlt: 'Science',
      speakerName: 'Dr. Zahra Malik',
      speakerImage: '/images/events-picture-original.png',
      speakerRole: 'Scientist & Scholar',
      date: '31 Dec, 2025',
      tags: ['#Science', '#Technology', '#Islamic', '#Innovation'],
      isRecorded: false,
    },
    {
      id: 12,
      title: 'Environmental Stewardship in Islam',
      description: 'Islamic perspective on environmental protection and sustainability.',
      imageUrl: '/images/events-picture-original.png',
      imageAlt: 'Environment',
      speakerName: 'Dr. Noor Ibrahim',
      speakerImage: '/images/events-picture-original.png',
      speakerRole: 'Environmentalist',
      date: '02 Jan, 2026',
      tags: ['#Environment', '#Sustainability', '#Islamic', '#Green'],
      isRecorded: true,
    },
    {
      id: 13,
      title: 'Islamic Charity and Social Justice',
      description: 'Understanding zakat, sadaqah, and social responsibility in Islam.',
      imageUrl: '/images/events-picture-original.png',
      imageAlt: 'Charity',
      speakerName: 'Sheikh Hamza Al-Rashid',
      speakerImage: '/images/events-picture-original.png',
      speakerRole: 'Community Leader',
      date: '03 Jan, 2026',
      tags: ['#Charity', '#Justice', '#Islamic', '#Community'],
      isRecorded: false,
    },
    {
      id: 14,
      title: 'Islamic Interfaith Dialogue',
      description: 'Building bridges and understanding between different faith communities.',
      imageUrl: '/images/events-picture-original.png',
      imageAlt: 'Interfaith',
      speakerName: 'Dr. Rabia Hassan',
      speakerImage: '/images/events-picture-original.png',
      speakerRole: 'Interfaith Expert',
      date: '04 Jan, 2026',
      tags: ['#Interfaith', '#Dialogue', '#Peace', '#Understanding'],
      isRecorded: false,
    },
    {
      id: 15,
      title: 'Islamic Medicine and Healing',
      description: 'Exploring traditional Islamic medicine and modern healthcare.',
      imageUrl: '/images/events-picture-original.png',
      imageAlt: 'Medicine',
      speakerName: 'Dr. Salim Hassan',
      speakerImage: '/images/events-picture-original.png',
      speakerRole: 'Medical Doctor',
      date: '05 Jan, 2026',
      tags: ['#Medicine', '#Health', '#Islamic', '#Healing'],
      isRecorded: true,
    },
    {
      id: 16,
      title: 'Islamic Education and Learning',
      description: 'Best practices in Islamic education and the importance of lifelong learning.',
      imageUrl: '/images/events-picture-original.png',
      imageAlt: 'Education',
      speakerName: 'Dr. Amina Al-Rashid',
      speakerImage: '/images/events-picture-original.png',
      speakerRole: 'Education Specialist',
      date: '06 Jan, 2026',
      tags: ['#Education', '#Learning', '#Islamic', '#Development'],
      isRecorded: false,
    },
    {
      id: 17,
      title: 'Islamic Spirituality and Personal Growth',
      description: 'Developing a deeper spiritual connection and personal growth through Islam.',
      imageUrl: '/images/events-picture-original.png',
      imageAlt: 'Spirituality',
      speakerName: 'Sheikh Rashid Al-Hassan',
      speakerImage: '/images/events-picture-original.png',
      speakerRole: 'Spiritual Guide',
      date: '07 Jan, 2026',
      tags: ['#Spirituality', '#Growth', '#Islamic', '#Personal'],
      isRecorded: false,
    },
  ];

  constructor() {
    this.updatePages();
  }

  private updatePages(): void {
    const totalPages = Math.ceil(this.eventCards.length / this.itemsPerPage);
    this.pages = Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  prevPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
    }
  }

  nextPage(): void {
    if (this.currentPage < this.pages.length) {
      this.currentPage++;
    }
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.pages.length) {
      this.currentPage = page;
    }
  }

  trackByIndex(index: number): number {
    return index;
  }

  get paginatedEventCards(): EventCard[] {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    return this.eventCards.slice(startIndex, endIndex);
  }
}
