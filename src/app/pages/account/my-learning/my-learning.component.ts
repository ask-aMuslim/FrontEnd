import { Component, OnInit, inject, ElementRef, viewChild, AfterViewInit, OnDestroy, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, Subject, forkJoin, of, switchMap, tap, catchError, finalize, map, take } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { InlineSvgDirective } from '../../../shared/directives/inline-svg.directive';
import { StudentFacade } from '../../../api/facades/student.facade';
import { EnrollmentFacade, EnrollmentReadDto } from '../../../api/facades/enrollment.facade';
import { CourseFacade, CourseReadDto } from '../../../api/facades/course.facade';
import { LessonFacade, LessonReadDto, LessonNote } from '../../../api/facades/lesson.facade';
import { LevelFacade, LevelReadDto } from '../../../api/facades/level.facade';
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
  lessonId: string;
  courseId: string;
  levelId: string;
  level: string;
  course: string;
  lesson: string;
  progressTime: string;
  progressSeconds: number;
  body: string;
  createdAt: string;
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
  private readonly levelFacade = inject(LevelFacade);
  private readonly academyProgressService = inject(AcademyProgressService);
  readonly scrollRow = viewChild<ElementRef<HTMLDivElement>>('scrollRow');

  private readonly destroy$ = new Subject<void>();
  private readonly levelTitlesById = new Map<string, string>();

  // Drag scroll state
  private isDragging = false;
  private startX = 0;
  private scrollLeft = 0;

  searchQuery = '';
  selectedCourseFilter = 'All Courses';
  selectedLessonFilter = 'All Lessons';
  selectedLevelFilter = 'All Levels';
  selectedSortOrder: 'Latest' | 'Oldest' = 'Latest';

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
    this.loadLevelTitles();
    this.loadStudentData();
  }

  ngAfterViewInit(): void {
    this.initDragScroll();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadLevelTitles(): void {
    this.levelFacade
      .getAllLevels()
      .pipe(
        take(1),
        catchError(() => of([] as LevelReadDto[])),
        takeUntil(this.destroy$),
      )
      .subscribe((levels) => {
        this.levelTitlesById.clear();
        levels.forEach((level) => {
          if (level.id && level.title) {
            this.levelTitlesById.set(level.id, level.title);
          }
        });

        this.refreshExistingNoteLevels();
      });
  }

  private loadStudentData(): void {
    this.isLoading.set(true);
    this.error.set(null);
    this.notesError.set(null);
    this.savedLessonsSignal.set([]);
    this.coursesSignal.set([]);
    this.allNotesSignal.set([]);
    this.filteredNotes = [];

    // Load remaining courses for the current stage
    this.academyProgressService.getStudentProgress().pipe(
      switchMap(progress => {
        if (!progress) return of([]);
        return this.academyProgressService.getStageCoursesWithProgress(progress.currentStage).pipe(
          map(courses => courses.filter(c => c.progress.status !== 'completed'))
        );
      }),
      catchError(() => of([])),
      tap(remaining => this.remainingCoursesSignal.set(remaining)),
      takeUntil(this.destroy$)
    ).subscribe();

    this.studentFacade.me().pipe(
      take(1),
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
      catchError(() => of([] as CourseWithLessons[])),
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
    const savedLessonsById = new Map(currentLessons.map((lesson) => [lesson.id, lesson]));
    const newLessons: SavedLesson[] = lessons.map((lesson, index) => ({
      id: lesson.id || `lesson-${index}`,
      courseId: course.id || '',
      course: course.title || 'Unknown Course',
      lesson: lesson.title || 'Untitled Lesson',
      duration: this.formatDuration(),
      badge: String.fromCodePoint(65 + (index % 26)), // A, B, C...
    }));

    newLessons.forEach((lesson) => {
      savedLessonsById.set(lesson.id, lesson);
    });

    this.savedLessonsSignal.set(Array.from(savedLessonsById.values()));
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
      this.allNotesSignal.set([]);
      this.filteredNotes = [];
      this.isLoadingNotes.set(false);
      return;
    }

    forkJoin(lessonNoteRequests)
      .pipe(
        tap((lessonWithNotesArray) => {
          const allNotes: Note[] = [];

          lessonWithNotesArray.forEach((item) => {
            item.notes.forEach((note) => {
              const progressSeconds = this.resolveProgressSeconds(note);
              const levelId = this.resolveLevelId(item.course);
              const rawBody = (note.content ?? note.text ?? '').trim();
              allNotes.push({
                id: note.id,
                lessonId: item.lesson.id || '',
                courseId: item.course.id || '',
                levelId,
                level: this.resolveLevelTitle(item.course, levelId),
                course: item.course.title || 'Unknown Course',
                lesson: item.lesson.title || 'Untitled Lesson',
                progressTime: this.formatProgressTime(progressSeconds),
                progressSeconds,
                body: rawBody.length > 0 ? rawBody : 'No note content',
                createdAt: this.toIsoDate(note.createdAt),
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

  private refreshExistingNoteLevels(): void {
    const existingNotes = this.allNotesSignal();
    if (existingNotes.length === 0) {
      return;
    }

    const nextNotes = existingNotes.map((note) => ({
      ...note,
      level: this.resolveLevelTitleById(note.levelId, note.level),
    }));

    this.allNotesSignal.set(nextNotes);
    this.updateFilteredNotes();
  }

  private resolveLevelId(course: CourseReadDto): string {
    return typeof course.levelId === 'string' ? course.levelId : '';
  }

  private resolveLevelTitle(course: CourseReadDto, levelId: string): string {
    if (typeof course.level === 'string' && course.level.trim().length > 0) {
      return course.level.trim();
    }

    return this.resolveLevelTitleById(levelId, 'Unknown Level');
  }

  private resolveLevelTitleById(levelId: string, fallback: string): string {
    if (levelId && this.levelTitlesById.has(levelId)) {
      return this.levelTitlesById.get(levelId) ?? fallback;
    }

    return fallback;
  }

  private resolveProgressSeconds(note: LessonNote): number {
    const candidate = note.timestamp;
    if (typeof candidate === 'number' && Number.isFinite(candidate) && candidate >= 0) {
      return candidate <= 86_400 ? candidate : 0;
    }

    if (typeof candidate === 'string') {
      const parsed = Number.parseFloat(candidate);
      if (Number.isFinite(parsed) && parsed >= 0) {
        return parsed <= 86_400 ? parsed : 0;
      }
    }

    return 0;
  }

  private formatProgressTime(progressSeconds: number): string {
    const totalSeconds = Math.max(0, Math.floor(progressSeconds));
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (hours > 0) {
      return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    }

    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }

  private toIsoDate(createdAt: string | undefined): string {
    const parsed = typeof createdAt === 'string' ? new Date(createdAt) : null;
    if (parsed && Number.isFinite(parsed.getTime())) {
      return parsed.toISOString();
    }

    return new Date().toISOString();
  }

  private toTimestampMillis(value: string): number {
    const parsed = new Date(value).getTime();
    return Number.isFinite(parsed) ? parsed : 0;
  }

  updateFilteredNotes(): void {
    let filtered = this.allNotesSignal();

    if (this.selectedCourseFilter !== 'All Courses') {
      filtered = filtered.filter((note) => note.course === this.selectedCourseFilter);
    }

    if (this.selectedLessonFilter !== 'All Lessons') {
      filtered = filtered.filter((note) => note.lesson === this.selectedLessonFilter);
    }

    if (this.selectedLevelFilter !== 'All Levels') {
      filtered = filtered.filter((note) => note.level === this.selectedLevelFilter);
    }

    if (this.searchQuery.trim()) {
      const query = this.searchQuery.toLowerCase();
      filtered = filtered.filter(
        (note) =>
          note.lesson.toLowerCase().includes(query)
          || note.course.toLowerCase().includes(query)
          || note.level.toLowerCase().includes(query)
          || note.body.toLowerCase().includes(query)
          || note.progressTime.toLowerCase().includes(query),
      );
    }

    filtered = [...filtered].sort((a, b) => this.toTimestampMillis(b.createdAt) - this.toTimestampMillis(a.createdAt));

    if (this.selectedSortOrder === 'Oldest') {
      filtered.reverse();
    }

    this.filteredNotes = filtered;
  }

  get hasActiveNoteFilters(): boolean {
    return this.searchQuery.trim().length > 0
      || this.selectedSortOrder !== 'Latest'
      || this.selectedCourseFilter !== 'All Courses'
      || this.selectedLessonFilter !== 'All Lessons'
      || this.selectedLevelFilter !== 'All Levels';
  }

  get noteResultsSummary(): string {
    const total = this.allNotesSignal().length;
    const visible = this.filteredNotes.length;

    if (total === 0) {
      return 'No notes found yet';
    }

    if (visible === total) {
      return `Showing all ${total} note${total === 1 ? '' : 's'}`;
    }

    return `Showing ${visible} of ${total} notes`;
  }

  clearNoteFilters(): void {
    this.searchQuery = '';
    this.selectedCourseFilter = 'All Courses';
    this.selectedLessonFilter = 'All Lessons';
    this.selectedLevelFilter = 'All Levels';
    this.selectedSortOrder = 'Latest';
    this.updateFilteredNotes();
  }

  formatNoteCreatedAt(note: Note): string {
    const timestamp = this.toTimestampMillis(note.createdAt);
    if (timestamp <= 0) {
      return 'Unknown date';
    }

    return new Date(timestamp).toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  }

  onSearchChange(query: string): void {
    this.searchQuery = query;
    this.updateFilteredNotes();
  }

  onCourseFilterChange(course: string): void {
    this.selectedCourseFilter = course;
    this.updateFilteredNotes();
  }

  onLessonFilterChange(lesson: string): void {
    this.selectedLessonFilter = lesson;
    this.updateFilteredNotes();
  }

  onLevelFilterChange(level: string): void {
    this.selectedLevelFilter = level;
    this.updateFilteredNotes();
  }

  onSortOrderChange(order: string): void {
    this.selectedSortOrder = order === 'Oldest' ? 'Oldest' : 'Latest';
    this.updateFilteredNotes();
  }

  getCourseFilterOptions(): string[] {
    const scopedNotes = this.selectedLevelFilter === 'All Levels'
      ? this.allNotesSignal()
      : this.allNotesSignal().filter((note) => note.level === this.selectedLevelFilter);

    const courses = new Set(scopedNotes.map((note) => note.course));
    return ['All Courses', ...Array.from(courses).sort((a, b) => a.localeCompare(b))];
  }

  getLessonFilterOptions(): string[] {
    let scopedNotes = this.allNotesSignal();

    if (this.selectedCourseFilter !== 'All Courses') {
      scopedNotes = scopedNotes.filter((note) => note.course === this.selectedCourseFilter);
    }

    if (this.selectedLevelFilter !== 'All Levels') {
      scopedNotes = scopedNotes.filter((note) => note.level === this.selectedLevelFilter);
    }

    const lessons = new Set(scopedNotes.map((note) => note.lesson));
    return ['All Lessons', ...Array.from(lessons).sort((a, b) => a.localeCompare(b))];
  }

  getLevelFilterOptions(): string[] {
    const scopedNotes = this.selectedCourseFilter === 'All Courses'
      ? this.allNotesSignal()
      : this.allNotesSignal().filter((note) => note.course === this.selectedCourseFilter);

    const levels = new Set(scopedNotes.map((note) => note.level));
    return ['All Levels', ...Array.from(levels).sort((a, b) => a.localeCompare(b))];
  }

  openNoteInLesson(note: Note): void {
    if (!note.courseId || !note.lessonId) {
      this.goToCourse(note.courseId || note.course);
      return;
    }

    void this.router.navigate(
      ['/academy/course', note.courseId, 'lesson', note.lessonId],
      {
        queryParams: {
          tab: 'notes',
          noteId: note.id,
          seek: Math.max(0, Math.floor(note.progressSeconds)),
        },
      },
    );
  }

  goToCourse(courseRef: string): void {
    const exactIdMatch = this.remainingCoursesSignal().find((course) => course.id === courseRef);
    if (exactIdMatch) {
      void this.router.navigate(['/academy/course', exactIdMatch.id]);
      return;
    }

    const normalizedRef = courseRef.trim().toLowerCase();
    const titleMatch = this.remainingCoursesSignal().find(
      (course) => course.title.trim().toLowerCase() === normalizedRef,
    );

    if (titleMatch) {
      void this.router.navigate(['/academy/course', titleMatch.id]);
      return;
    }

    const fallbackCourseId = this.savedLessonsSignal().find(
      (lesson) => lesson.course.trim().toLowerCase() === normalizedRef,
    )?.courseId;

    if (fallbackCourseId) {
      void this.router.navigate(['/academy/course', fallbackCourseId]);
    }
  }

  retryLoad(): void {
    this.loadStudentData();
  }
}
