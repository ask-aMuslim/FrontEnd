import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

interface Course {
  id: string;
  title: string;
  category: string;
  lessons: number;
  duration: string;
  progress: number;
  status: 'completed' | 'in-progress' | 'locked' | 'available';
}

interface Stage {
  number: number;
  title: string;
  description: string;
  isLocked: boolean;
  courses: {
    mainBelieves: Course[];
    modelsStories: Course[];
    socialTopics: Course[];
  };
}

interface RecentLesson {
  stageNumber: number;
  courseName: string;
  lessonNumber: number;
  thumbnailUrl: string;
  progress: number;
  currentTime: string;
  totalTime: string;
  completedLessons: number;
  totalLessons: number;
}

@Component({
  selector: 'app-roadmap',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './roadmap.component.html',
  styleUrls: ['./roadmap.component.scss']
})
export class RoadmapComponent {
  recentLesson: RecentLesson = {
    stageNumber: 1,
    courseName: 'Prayer (Salah)',
    lessonNumber: 2,
    thumbnailUrl: 'https://api.builder.io/api/v1/image/assets/TEMP/441a117073f0c3911df8ecc8c6651341d4206320?width=520',
    progress: 20,
    currentTime: '00:00',
    totalTime: '12:00',
    completedLessons: 2,
    totalLessons: 5
  };

  importantNote = 'The roadmap consists of three stages. Each stage includes a list of courses covering the meaning of belief, true Islamic values from the prophet Mohamed (peace be upon him) and his companions, and important topics we face every day. Each course consists of lessons that will guide you step by step. You can take notes while learning and share them with your scholar. This roadmap for new Muslims, and it was created by 40+ scholars from the Islamic Center of America and is endorsed by the International Union of Muslim Scholars.';
  
  showFullNote = false;

  stages: Stage[] = [
    {
      number: 1,
      title: 'Stage 1',
      description: 'Begin your journey by building a strong and informed faith. This stage starts with the core of Islam—its compelling doctrine and logical view of life and the hereafter. You will then translate belief into practice by learning the purity of ablution and the serenity of prayer. Finally, you\'ll tackle vital contemporary topics, gaining an Islamic perspective on equality, the true role of women, and the timeless guidance from the life of Prophet Muhammad (peace be upon him).',
      isLocked: false,
      courses: {
        modelsStories: [
          {
            id: 's1-ms-1',
            title: 'Faith & Belief',
            category: 'B: Models & Stories',
            lessons: 6,
            duration: '4h 10m',
            progress: 100,
            status: 'completed'
          }
        ],
        mainBelieves: [
          {
            id: 's1-mb-1',
            title: 'Prayer (Salah)',
            category: 'A: Main Believes',
            lessons: 6,
            duration: '4h 10m',
            progress: 20,
            status: 'in-progress'
          }
        ],
        socialTopics: [
          {
            id: 's1-st-1',
            title: 'Faith & Belief',
            category: 'C: Social Topics',
            lessons: 6,
            duration: '4h 10m',
            progress: 0,
            status: 'available'
          },
          {
            id: 's1-st-2',
            title: 'Faith & Belief',
            category: 'C: Social Topics',
            lessons: 6,
            duration: '4h 10m',
            progress: 0,
            status: 'available'
          }
        ]
      }
    },
    {
      number: 2,
      title: 'Stage 2',
      description: 'After you have learned .. This stage starts with the core of Islam—its compelling doctrine and logical view of life and the hereafter. You will then translate belief into practice by learning the purity of ablution and the serenity of prayer. Finally, you\'ll tackle vital contemporary topics, gaining an Islamic perspective on equality, the true role of women, and the timeless guidance from the life of Prophet Muhammad (peace be upon him).',
      isLocked: true,
      courses: {
        modelsStories: [
          {
            id: 's2-ms-1',
            title: 'Faith & Belief',
            category: 'B: Models & Stories',
            lessons: 6,
            duration: '4h 10m',
            progress: 0,
            status: 'locked'
          }
        ],
        mainBelieves: [
          {
            id: 's2-mb-1',
            title: 'Prayer (Salah)',
            category: 'A: Main Believes',
            lessons: 6,
            duration: '4h 10m',
            progress: 0,
            status: 'locked'
          }
        ],
        socialTopics: [
          {
            id: 's2-st-1',
            title: 'Faith & Belief',
            category: 'C: Social Topics',
            lessons: 6,
            duration: '4h 10m',
            progress: 0,
            status: 'locked'
          },
          {
            id: 's2-st-2',
            title: 'Faith & Belief',
            category: 'C: Social Topics',
            lessons: 6,
            duration: '4h 10m',
            progress: 0,
            status: 'locked'
          }
        ]
      }
    },
    {
      number: 3,
      title: 'Stage 3',
      description: 'After you have learned .. This stage starts with the core of Islam—its compelling doctrine and logical view of life and the hereafter. You will then translate belief into practice by learning the purity of ablution and the serenity of prayer. Finally, you\'ll tackle vital contemporary topics, gaining an Islamic perspective on equality, the true role of women, and the timeless guidance from the life of Prophet Muhammad (peace be upon him).',
      isLocked: true,
      courses: {
        modelsStories: [
          {
            id: 's3-ms-1',
            title: 'Faith & Belief',
            category: 'B: Models & Stories',
            lessons: 6,
            duration: '4h 10m',
            progress: 0,
            status: 'locked'
          }
        ],
        mainBelieves: [
          {
            id: 's3-mb-1',
            title: 'Prayer (Salah)',
            category: 'A: Main Believes',
            lessons: 6,
            duration: '4h 10m',
            progress: 0,
            status: 'locked'
          }
        ],
        socialTopics: [
          {
            id: 's3-st-1',
            title: 'Faith & Belief',
            category: 'C: Social Topics',
            lessons: 6,
            duration: '4h 10m',
            progress: 0,
            status: 'locked'
          },
          {
            id: 's3-st-2',
            title: 'Faith & Belief',
            category: 'C: Social Topics',
            lessons: 6,
            duration: '4h 10m',
            progress: 0,
            status: 'locked'
          }
        ]
      }
    },
    {
      number: 4,
      title: 'Stage 4',
      description: 'After you have learned .. This stage starts with the core of Islam—its compelling doctrine and logical view of life and the hereafter. You will then translate belief into practice by learning the purity of ablution and the serenity of prayer. Finally, you\'ll tackle vital contemporary topics, gaining an Islamic perspective on equality, the true role of women, and the timeless guidance from the life of Prophet Muhammad (peace be upon him).',
      isLocked: true,
      courses: {
        modelsStories: [
          {
            id: 's4-ms-1',
            title: 'Faith & Belief',
            category: 'B: Models & Stories',
            lessons: 6,
            duration: '4h 10m',
            progress: 0,
            status: 'locked'
          }
        ],
        mainBelieves: [
          {
            id: 's4-mb-1',
            title: 'Prayer (Salah)',
            category: 'A: Main Believes',
            lessons: 6,
            duration: '4h 10m',
            progress: 0,
            status: 'locked'
          }
        ],
        socialTopics: [
          {
            id: 's4-st-1',
            title: 'Faith & Belief',
            category: 'C: Social Topics',
            lessons: 6,
            duration: '4h 10m',
            progress: 0,
            status: 'locked'
          },
          {
            id: 's4-st-2',
            title: 'Faith & Belief',
            category: 'C: Social Topics',
            lessons: 6,
            duration: '4h 10m',
            progress: 0,
            status: 'locked'
          }
        ]
      }
    },
    {
      number: 5,
      title: 'Stage 5',
      description: 'After you have learned .. This stage starts with the core of Islam—its compelling doctrine and logical view of life and the hereafter. You will then translate belief into practice by learning the purity of ablution and the serenity of prayer. Finally, you\'ll tackle vital contemporary topics, gaining an Islamic perspective on equality, the true role of women, and the timeless guidance from the life of Prophet Muhammad (peace be upon him).',
      isLocked: true,
      courses: {
        modelsStories: [
          {
            id: 's5-ms-1',
            title: 'Faith & Belief',
            category: 'B: Models & Stories',
            lessons: 6,
            duration: '4h 10m',
            progress: 0,
            status: 'locked'
          }
        ],
        mainBelieves: [
          {
            id: 's5-mb-1',
            title: 'Prayer (Salah)',
            category: 'A: Main Believes',
            lessons: 6,
            duration: '4h 10m',
            progress: 0,
            status: 'locked'
          }
        ],
        socialTopics: [
          {
            id: 's5-st-1',
            title: 'Faith & Belief',
            category: 'C: Social Topics',
            lessons: 6,
            duration: '4h 10m',
            progress: 0,
            status: 'locked'
          },
          {
            id: 's5-st-2',
            title: 'Faith & Belief',
            category: 'C: Social Topics',
            lessons: 6,
            duration: '4h 10m',
            progress: 0,
            status: 'locked'
          }
        ]
      }
    },
    {
      number: 6,
      title: 'Stage 6',
      description: 'After you have learned .. This stage starts with the core of Islam—its compelling doctrine and logical view of life and the hereafter. You will then translate belief into practice by learning the purity of ablution and the serenity of prayer. Finally, you\'ll tackle vital contemporary topics, gaining an Islamic perspective on equality, the true role of women, and the timeless guidance from the life of Prophet Muhammad (peace be upon him).',
      isLocked: true,
      courses: {
        modelsStories: [
          {
            id: 's6-ms-1',
            title: 'Faith & Belief',
            category: 'B: Models & Stories',
            lessons: 6,
            duration: '4h 10m',
            progress: 0,
            status: 'locked'
          }
        ],
        mainBelieves: [
          {
            id: 's6-mb-1',
            title: 'Prayer (Salah)',
            category: 'A: Main Believes',
            lessons: 6,
            duration: '4h 10m',
            progress: 0,
            status: 'locked'
          }
        ],
        socialTopics: [
          {
            id: 's6-st-1',
            title: 'Faith & Belief',
            category: 'C: Social Topics',
            lessons: 6,
            duration: '4h 10m',
            progress: 0,
            status: 'locked'
          },
          {
            id: 's6-st-2',
            title: 'Faith & Belief',
            category: 'C: Social Topics',
            lessons: 6,
            duration: '4h 10m',
            progress: 0,
            status: 'locked'
          }
        ]
      }
    },
    {
      number: 7,
      title: 'Stage 7',
      description: 'After you have learned .. This stage starts with the core of Islam—its compelling doctrine and logical view of life and the hereafter. You will then translate belief into practice by learning the purity of ablution and the serenity of prayer. Finally, you\'ll tackle vital contemporary topics, gaining an Islamic perspective on equality, the true role of women, and the timeless guidance from the life of Prophet Muhammad (peace be upon him).',
      isLocked: true,
      courses: {
        modelsStories: [
          {
            id: 's7-ms-1',
            title: 'Faith & Belief',
            category: 'B: Models & Stories',
            lessons: 6,
            duration: '4h 10m',
            progress: 0,
            status: 'locked'
          }
        ],
        mainBelieves: [
          {
            id: 's7-mb-1',
            title: 'Prayer (Salah)',
            category: 'A: Main Believes',
            lessons: 6,
            duration: '4h 10m',
            progress: 0,
            status: 'locked'
          }
        ],
        socialTopics: [
          {
            id: 's7-st-1',
            title: 'Faith & Belief',
            category: 'C: Social Topics',
            lessons: 6,
            duration: '4h 10m',
            progress: 0,
            status: 'locked'
          },
          {
            id: 's7-st-2',
            title: 'Faith & Belief',
            category: 'C: Social Topics',
            lessons: 6,
            duration: '4h 10m',
            progress: 0,
            status: 'locked'
          }
        ]
      }
    }
  ];

  toggleNote(): void {
    this.showFullNote = !this.showFullNote;
  }

  continueLearning(): void {
    console.log('Continue learning clicked');
  }

  onCourseClick(course: Course): void {
    if (course.status !== 'locked') {
      console.log('Course clicked:', course);
    }
  }
}
