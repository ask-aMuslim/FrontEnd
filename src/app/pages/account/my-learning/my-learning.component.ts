import { Component, OnInit, inject, ElementRef, viewChild, AfterViewInit } from '@angular/core';
import { Router } from '@angular/router';

import { InlineSvgDirective } from '../../../shared/directives/inline-svg.directive';

interface SavedLesson {
  id: string;
  courseId: string;
  course: string;
  lesson: string;
  duration: string;
  badge: string;
}

interface Note {
  id: string;
  course: string;
  label: string;
  body: string;
  html: string;
}

@Component({
  selector: 'app-my-learning',
  imports: [InlineSvgDirective],
  templateUrl: './my-learning.component.html',
  styleUrls: ['./my-learning.component.scss'],
})
export class MyLearningComponent implements OnInit, AfterViewInit {
  private readonly router = inject(Router);
  readonly scrollRow = viewChild<ElementRef<HTMLDivElement>>('scrollRow');

  // Drag scroll state
  private isDragging = false;
  private startX = 0;
  private scrollLeft = 0;

  searchQuery = '';
  selectedCourseFilter = 'All Courses';
  selectedSortOrder = 'Latest';

  savedLessons: SavedLesson[] = [
    { id: '1', courseId: 'course-a', course: 'Course A', lesson: 'Lesson name', duration: '3 min', badge: 'A' },
    { id: '2', courseId: 'course-a', course: 'Course A', lesson: 'Lesson name', duration: '3 min', badge: 'B' },
    { id: '3', courseId: 'course-a', course: 'Course A', lesson: 'Lesson name', duration: '3 min', badge: 'C' },
    { id: '4', courseId: 'course-a', course: 'Course A', lesson: 'Lesson name', duration: '3 min', badge: 'D' },
    { id: '5', courseId: 'course-a', course: 'Course A', lesson: 'Lesson name', duration: '3 min', badge: 'E' },
    { id: '6', courseId: 'course-a', course: 'Course A', lesson: 'Lesson name', duration: '3 min', badge: 'F' },
  ];

  allNotes: Note[] = [
    {
      id: '1',
      course: 'Course A',
      label: '{Lesson1} 8:20',
      body: 'My note is written here. My note is written here. My note is written here. My note is written here.',
      html: '',
    },
    {
      id: '2',
      course: 'Course A',
      label: '{Lesson2} 10:45',
      body: 'Important concept explained clearly. Important concept explained clearly.',
      html: '',
    },
    {
      id: '3',
      course: 'Course B',
      label: '{Lesson1} 8:20',
      body: 'My note is written here. My note is written here. My note is written here. My note is written here.',
      html: '',
    },
    {
      id: '4',
      course: 'Course B',
      label: '{Lesson3} 2:15',
      body: 'Review this section later. Review this section later.',
      html: '',
    },
  ];

  filteredNotes: Note[] = [];

  ngOnInit(): void {
    this.updateFilteredNotes();
  }

  ngAfterViewInit(): void {
    this.initDragScroll();
  }

  private initDragScroll(): void {
    const el = this.scrollRow()?.nativeElement;
    if (!el) return;

    el.addEventListener('mousedown', (e: MouseEvent) => {
      this.isDragging = true;
      this.startX = e.pageX - el.offsetLeft;
      this.scrollLeft = el.scrollLeft;
      el.style.cursor = 'grabbing';
      el.style.userSelect = 'none';
    });

    el.addEventListener('mousemove', (e: MouseEvent) => {
      if (!this.isDragging) return;
      e.preventDefault();
      const x = e.pageX - el.offsetLeft;
      const walk = (x - this.startX) * 1.5;
      el.scrollLeft = this.scrollLeft - walk;
    });

    const stopDrag = (): void => {
      this.isDragging = false;
      el.style.cursor = 'grab';
      el.style.userSelect = '';
    };

    el.addEventListener('mouseup', stopDrag);
    el.addEventListener('mouseleave', stopDrag);
  }

  updateFilteredNotes(): void {
    let filtered = this.allNotes;

    if (this.selectedCourseFilter !== 'All Courses') {
      filtered = filtered.filter((note) => note.course === this.selectedCourseFilter);
    }

    if (this.searchQuery.trim()) {
      const query = this.searchQuery.toLowerCase();
      filtered = filtered.filter(
        (note) =>
          note.label.toLowerCase().includes(query) || note.body.toLowerCase().includes(query),
      );
    }

    if (this.selectedSortOrder === 'Latest') {
      filtered.reverse();
    }

    this.filteredNotes = filtered;
  }

  onSearchChange(query: string): void {
    this.searchQuery = query;
    this.updateFilteredNotes();
  }

  onCourseFilterChange(course: string): void {
    this.selectedCourseFilter = course;
    this.updateFilteredNotes();
  }

  onSortOrderChange(order: string): void {
    this.selectedSortOrder = order;
    this.updateFilteredNotes();
  }

  getNotesByCourse(course: string): Note[] {
    return this.filteredNotes.filter((note) => note.course === course);
  }

  getCoursesWithNotes(): string[] {
    const courses = new Set(this.filteredNotes.map((note) => note.course));
    return Array.from(courses);
  }

  goToCourse(course: string): void {
    const courseSlug = course.toLowerCase().replaceAll(/\s+/g, '-');
    this.router.navigate(['/academy/course', courseSlug]);
  }
}
