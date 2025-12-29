import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

interface Lesson {
  id: string;
  title: string;
  duration: string;
  type: 'index' | 'video' | 'quiz';
  isLocked: boolean;
  isCompleted: boolean;
  hasNotification?: boolean;
}

interface CourseDetails {
  id: string;
  stageNumber: number;
  title: string;
  intro: string;
  lessons: string[];
  answers: string[];
  totalLessons: number;
  completedLessons: number;
  duration: string;
  isLocked: boolean;
  lessonsList: Lesson[];
}

@Component({
  selector: 'app-course',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './course.component.html',
  styleUrls: ['./course.component.scss'],
})
export class CourseComponent implements OnInit {
  constructor(private router: Router, private route: ActivatedRoute) { }
  course: CourseDetails = {
    id: 'course-a2',
    stageNumber: 1,
    title: 'Course A2: Prayer (Salah)',
    intro:
      "In this course, you'll learn about the actions that break wudu (ablution) according to the Hanafi Madhhab. The lesson explains in simple terms what nullifies wudu.",
    lessons: [
      'Introduction to Fiqh',
      'How to pray - part 1',
      'How to pray - part 2',
      'How to pray - part 3',
      'How to pray - part 4',
    ],
    answers: ['Why God..?', 'Is Mohamed..?'],
    totalLessons: 5,
    completedLessons: 0,
    duration: '4h 10m',
    isLocked: true,
    lessonsList: [
      {
        id: '1',
        title: 'Intro',
        duration: '1 min',
        type: 'index',
        isLocked: false,
        isCompleted: false,
      },
      {
        id: '2',
        title: 'Introduction To Fiqh',
        duration: '3 min',
        type: 'video',
        isLocked: true,
        isCompleted: false,
      },
      {
        id: '3',
        title: 'How To Pray - Part 1',
        duration: '3 min',
        type: 'video',
        isLocked: true,
        isCompleted: false,
      },
      {
        id: '4',
        title: 'How To Pray - Part 2',
        duration: '3 min',
        type: 'video',
        isLocked: true,
        isCompleted: false,
      },
      {
        id: '5',
        title: 'How To Pray - Part 3',
        duration: '3 min',
        type: 'video',
        isLocked: true,
        isCompleted: false,
      },
      {
        id: '6',
        title: 'How To Pray - Part 4',
        duration: '3 min',
        type: 'video',
        isLocked: true,
        isCompleted: false,
      },
      {
        id: '7',
        title: 'Quiz',
        duration: '3 min',
        type: 'quiz',
        isLocked: true,
        isCompleted: false,
      },
    ],
  };

  backgroundImageUrl =
    'https://api.builder.io/api/v1/image/assets/TEMP/98e741733a4ff78c0a93a200a7ab2b126de36fb0?width=2880';

  ngOnInit(): void {
    // Get course state from query params or route data
    this.route.queryParams.subscribe((params) => {
      if (params['unlocked'] === 'true') {
        this.unlockCourse();
      }
    });
  }

  unlockCourse(): void {
    this.course.isLocked = false;
    this.course.completedLessons = 4;
    this.course.lessonsList = [
      {
        id: '1',
        title: 'Intro',
        duration: '1 min',
        type: 'index',
        isLocked: false,
        isCompleted: false,
      },
      {
        id: '2',
        title: 'Introduction To Fiqh',
        duration: '3 min',
        type: 'video',
        isLocked: false,
        isCompleted: true,
      },
      {
        id: '3',
        title: 'How To Pray - Part 1',
        duration: '3 min',
        type: 'video',
        isLocked: false,
        isCompleted: true,
      },
      {
        id: '4',
        title: 'How To Pray - Part 2',
        duration: '3 min',
        type: 'video',
        isLocked: false,
        isCompleted: true,
        hasNotification: true,
      },
      {
        id: '5',
        title: 'How To Pray - Part 3',
        duration: '3 min',
        type: 'video',
        isLocked: false,
        isCompleted: false,
      },
      {
        id: '6',
        title: 'How To Pray - Part 4',
        duration: '3 min',
        type: 'video',
        isLocked: false,
        isCompleted: false,
      },
      {
        id: '7',
        title: 'Quiz',
        duration: '3 min',
        type: 'quiz',
        isLocked: false,
        isCompleted: false,
      },
    ];
  }

  onBeginClick(): void {
    if (!this.course.isLocked) {
      // Navigate to first lesson (index/intro)
      this.router.navigate(['lesson', '1'], { relativeTo: this.route });
    }
  }

  onTakeQuizClick(): void {
    if (!this.course.isLocked) {
      // Navigate to quiz lesson
      this.router.navigate(['lesson', '7'], { relativeTo: this.route });
    }
  }

  onLessonClick(lesson: Lesson): void {
    if (!lesson.isLocked) {
      // Navigate to lesson player: /roadmap/course/:courseId/lesson/:lessonId
      this.router.navigate(['lesson', lesson.id], { relativeTo: this.route });
    }
  }
}
