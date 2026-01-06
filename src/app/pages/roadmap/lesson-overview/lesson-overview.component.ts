import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';

interface Lesson {
  id: string;
  title: string;
  duration: string;
  type: 'intro' | 'video' | 'quiz';
  status: 'completed' | 'current' | 'pending' | 'feedback-needed';
  hasFeedback?: boolean;
}

interface CourseOverview {
  stageNumber: number;
  courseCode: string;
  courseTitle: string;
  intro: string;
  lessons: string[];
  questions: string[];
  currentLesson: number;
  totalLessons: number;
  totalDuration: string;
  backgroundImage: string;
}

@Component({
  selector: 'app-lesson-overview',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './lesson-overview.component.html',
  styleUrls: ['./lesson-overview.component.scss']
})
export class LessonOverviewComponent implements OnInit {
  breadcrumb = {
    items: ['Roadmap', 'Prayer (Salah)', 'Intro']
  };

  courseOverview: CourseOverview = {
    stageNumber: 1,
    courseCode: 'A2',
    courseTitle: 'Prayer (Salah)',
    intro: 'In this course, you\'ll learn about the actions that break wudu (ablution) according to the Hanafi Madhhab. The lesson explains in simple terms what nullifies wudu.',
    lessons: [
      'Introduction to Fiqh',
      'How to pray - part 1',
      'How to pray - part 2',
      'How to pray - part 3',
      'How to pray - part 4'
    ],
    questions: [
      'Why God ..?',
      'Is Mohamed ..?'
    ],
    currentLesson: 4,
    totalLessons: 5,
    totalDuration: '4h 10m',
    backgroundImage: 'https://api.builder.io/api/v1/image/assets/TEMP/98e741733a4ff78c0a93a200a7ab2b126de36fb0?width=2880'
  };

  lessonsList: Lesson[] = [
    {
      id: 'intro',
      title: 'Intro',
      duration: '1 min',
      type: 'intro',
      status: 'pending'
    },
    {
      id: 'introduction-to-fiqh',
      title: 'Introduction to Fiqh',
      duration: '3 min',
      type: 'video',
      status: 'completed'
    },
    {
      id: 'how-to-pray-part-1',
      title: 'How to pray - part 1',
      duration: '3 min',
      type: 'video',
      status: 'completed'
    },
    {
      id: 'how-to-pray-part-2',
      title: 'How to pray - part 2',
      duration: '3 min',
      type: 'video',
      status: 'completed',
      hasFeedback: true
    },
    {
      id: 'how-to-pray-part-3',
      title: 'How to pray - part 3',
      duration: '3 min',
      type: 'video',
      status: 'current'
    },
    {
      id: 'how-to-pray-part-4',
      title: 'How to pray - part 4',
      duration: '3 min',
      type: 'video',
      status: 'pending'
    },
    {
      id: 'quiz',
      title: 'Quiz',
      duration: '3 min',
      type: 'quiz',
      status: 'pending'
    }
  ];

  constructor(
    private route: ActivatedRoute,
    private router: Router
  ) { }

  ngOnInit(): void {
    // Could fetch course data based on route params
  }

  onBegin(): void {
    // Navigate to first lesson
    this.router.navigate(['../lesson', '1'], { relativeTo: this.route });
  }

  onTakeQuiz(): void {
    // Navigate to quiz lesson
    this.router.navigate(['../lesson', '7'], { relativeTo: this.route });
  }

  onLessonClick(lesson: Lesson): void {
    if (lesson.status !== 'pending') {
      this.router.navigate(['../lesson', lesson.id], { relativeTo: this.route });
    }
  }

  getLessonIcon(lesson: Lesson): string {
    if (lesson.status === 'completed') {
      return 'checked';
    }
    return lesson.type;
  }
}
