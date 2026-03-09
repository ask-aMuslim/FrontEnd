import { Component, OnInit, inject, ElementRef, viewChild, AfterViewInit, OnDestroy, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, Subject, forkJoin, of, switchMap, tap, catchError, finalize, map } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { InlineSvgDirective } from '../../../shared/directives/inline-svg.directive';
import { StudentFacade } from '../../../api/facades/student.facade';
import { EnrollmentFacade, EnrollmentReadDto } from '../../../api/facades/enrollment.facade';
import { CourseFacade, CourseReadDto } from '../../../api/facades/course.facade';
import { LessonFacade, LessonReadDto, LessonNote } from '../../../api/facades/lesson.facade';
import { AcademyProgressService } from '../../../core/services/academy-progress.service';
import { AcademyCourse, CourseProgress } from '../../../core/models/interfaces/academy-progress.model';

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

interface CourseWithLessons {
  course: CourseReadDto;
  lessons: LessonReadDto[];
}

interface LessonWithNotes {
  lesson: LessonReadDto;
  notes: LessonNote[];
  course: CourseReadDto;
}

@Component({
  selector: 'app-my-learning',
  imports: [InlineSvgDirective],
  templateUrl: './my-learning.component.html',
  styleUrls: ['./my-learning.component.scss'],
})
export class MyLearningComponent implements OnInit, AfterViewInit, OnDestroy {
  private readonly router = inject(Router);
  private readonly studentFacade = inject(StudentFacade);
  private readonly enrollmentFacade = inject(EnrollmentFacade);
  private readonly courseFacade = inject(CourseFacade);
  private readonly lessonFacade = inject(LessonFacade);
  private readonly academyProgressService = inject(AcademyProgressService);
  readonly scrollRow = viewChild<ElementRef<HTMLDivElement>>('scrollRow');

  private readonly destroy$ = new Subject<void>();

  // Drag scroll state
  private isDragging = false;
  private startX = 0;
  private scrollLeft = 0;

  searchQuery = '';
  selectedCourseFilter = 'All Courses';
  selectedSortOrder = 'Latest';

  // Loading and error states
  isLoading = signal(false);
  isLoadingNotes = signal(false);
  error = signal<string | null>(null);
  notesError = signal<string | null>(null);

  // Data signals
  private readonly savedLessonsSignal = signal<SavedLesson[]>([]);
  private readonly allNotesSignal = signal<Note[]>([]);
  private readonly coursesSignal = signal<string[]>([]);
  private readonly remainingCoursesSignal = signal<(AcademyCourse & { progress: CourseProgress })[]>([]);

  // Computed signals
  readonly savedLessons = computed(() => this.savedLessonsSignal());
  readonly allNotes = computed(() => this.allNotesSignal());
  readonly courses = computed(() => this.coursesSignal());
  readonly remainingCourses = computed(() => this.remainingCoursesSignal());
  readonly hasLessons = computed(() => this.savedLessonsSignal().length > 0);
  readonly hasNotes = computed(() => this.allNotesSignal().length > 0);
  readonly hasRemainingCourses = computed(() => this.remainingCoursesSignal().length > 0);

  filteredNotes: Note[] = [];

  ngOnInit(): void {
    this.loadStudentData();
  }

  ngAfterViewInit(): void {
    this.initDragScroll();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadStudentData(): void {
    this.isLoading.set(true);
    this.error.set(null);

    // Load remaining courses for the current stage
    this.academyProgressService.getStudentProgress().pipe(
      switchMap(progress => {
        if (!progress) return of([]);
        return this.academyProgressService.getStageCoursesWithProgress(progress.currentStage).pipe(
          map(courses => courses.filter(c => c.progress.status !== 'completed'))
        );
      }),
      tap(remaining => this.remainingCoursesSignal.set(remaining)),
      takeUntil(this.destroy$)
    ).subscribe();

    this.studentFacade.me().pipe(
      switchMap((profile) => {
        if (!profile?.id) {
          return of([]);
        }
        return this.enrollmentFacade.getEnrolledCoursesByStudent(profile.id);
      }),
      switchMap((enrollments: EnrollmentReadDto[]) => {
        if (enrollments.length === 0) {
          return of([]);
        }

        const courseIds = enrollments
          .map((e) => e.courseId)
          .filter((id): id is string => typeof id === 'string' && id.length > 0);

        const uniqueCourseIds = Array.from(new Set(courseIds));

        if (uniqueCourseIds.length === 0) {
          return of([]);
        }

        return forkJoin(
          uniqueCourseIds.map((courseId) => this.fetchCourseWithLessons(courseId))
        );
      }),
      tap((coursesWithLessons) => {
        const validCourses = coursesWithLessons.filter(
          (item): item is CourseWithLessons => item !== null && item.course !== null
        );

        // Extract unique course names for filter dropdown
        const courseNames = validCourses.map((item) => item.course.title).filter((name): name is string => !!name);
        this.coursesSignal.set(Array.from(new Set(courseNames)));

        // Load notes for all lessons
        this.loadNotesForLessons(validCourses);
      }),
      catchError(() => {
        this.error.set('Failed to load your learning data. Please try again.');
        return of(null);
      }),
      finalize(() => this.isLoading.set(false)),
      takeUntil(this.destroy$)
    ).subscribe();
  }

  private fetchCourseWithLessons(courseId: string): Observable<CourseWithLessons | null> {
    return this.courseFacade.getCourseById(courseId).pipe(
      switchMap((course) => {
        if (!course?.id) {
          return of(null);
        }
        return this.lessonFacade.getCourseLessons(course.id).pipe(
          tap((lessons) => this.appendSavedLessons(course, lessons)),
          map((lessons) => ({ course, lessons }))
        );
      }),
      catchError(() => of(null))
    );
  }

  private appendSavedLessons(course: CourseReadDto, lessons: LessonReadDto[]): void {
    const currentLessons = this.savedLessonsSignal();
    const newLessons: SavedLesson[] = lessons.map((lesson, index) => ({
      id: lesson.id || `lesson-${index}`,
      courseId: course.id || '',
      course: course.title || 'Unknown Course',
      lesson: lesson.title || 'Untitled Lesson',
      duration: this.formatDuration(),
      badge: String.fromCodePoint(65 + (index % 26)), // A, B, C...
    }));

    this.savedLessonsSignal.set([...currentLessons, ...newLessons]);
  }

  private loadNotesForLessons(coursesWithLessons: CourseWithLessons[]): void {
    this.isLoadingNotes.set(true);
    this.notesError.set(null);

    const lessonNoteRequests = coursesWithLessons.flatMap((item) =>
      item.lessons.map((lesson) =>
        this.lessonFacade.getNotes(lesson.id || '').pipe(
          map((notes): LessonWithNotes => ({
            lesson,
            notes,
            course: item.course,
          })),
          catchError(() => of({ lesson, notes: [], course: item.course } as LessonWithNotes))
        )
      )
    );

    if (lessonNoteRequests.length === 0) {
      this.isLoadingNotes.set(false);
      return;
    }

    forkJoin(lessonNoteRequests)
      .pipe(
        tap((lessonWithNotesArray) => {
          const allNotes: Note[] = [];

          lessonWithNotesArray.forEach((item) => {
            item.notes.forEach((note) => {
              allNotes.push({
                id: note.id,
                course: item.course.title || 'Unknown Course',
                label: `{${item.lesson.title}} ${new Date(note.createdAt).toLocaleTimeString()}`,
                body: note.content ?? note.text ?? '',
                html: '',
              });
            });
          });

          this.allNotesSignal.set(allNotes);
          this.updateFilteredNotes();
        }),
        catchError(() => {
          this.notesError.set('Failed to load your notes.');
          return of(null);
        }),
        finalize(() => this.isLoadingNotes.set(false)),
        takeUntil(this.destroy$)
      )
      .subscribe();
  }

  private formatDuration(): string {
    // Static placeholder - actual video duration not yet available from API
    return '3 min';
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
    let filtered = this.allNotesSignal();

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
      filtered = [...filtered].reverse();
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

  retryLoad(): void {
    this.loadStudentData();
  }
}
