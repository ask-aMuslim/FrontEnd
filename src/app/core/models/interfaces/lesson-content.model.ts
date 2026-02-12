import { LessonType } from './enums.model';

/**
 * Intro Lesson Content
 * Represents an introduction/overview lesson for a course
 */
export interface IntroLessonContent {
  id: string;
  type: 'intro';
  title: string;
  description: string;
  courseOverview: string;
  objectives: string[];
  duration: string;
  thumbnailUrl?: string;
}

/**
 * Video Lesson Content
 * Represents a lesson with video media content
 */
export interface VideoLessonContent {
  id: string;
  type: LessonType.Video;
  title: string;
  description: string;
  videoUrl: string;
  thumbnailUrl?: string;
  duration: string;
  transcript?: string;
}

/**
 * Audio Lesson Content
 * Represents a lesson with audio media and text content
 * Audio is positioned above text content
 */
export interface AudioLessonContent {
  id: string;
  type: LessonType.Audio;
  title: string;
  description: string;
  audioUrl: string;
  duration: string;
  transcript: string; // Text content displayed below audio
  language?: 'English' | 'Arabic';
  subtitles?: 'English, Arabic';
}

/**
 * Article/Document Lesson Content
 * Represents a lesson with text-based content in sections
 */
export interface ArticleLessonContent {
  id: string;
  type: LessonType.Article | LessonType.Document;
  title: string;
  description: string;
  sections: ArticleSection[];
  language?: 'English' | 'Arabic';
  lastUpdated?: string;
}

/**
 * Article Section with header and content
 */
export interface ArticleSection {
  header: string;
  content: string;
}

/**
 * Union type representing any lesson content
 */
export type LessonContent = IntroLessonContent | VideoLessonContent | AudioLessonContent | ArticleLessonContent;

/**
 * Tab types for lesson player
 */
export type LessonPlayerTab = 'overview' | 'notes' | 'ai-assistant' | 'feedback';

/**
 * Lesson metadata for sidebar and navigation
 */
export interface LessonMetadata {
  id: string;
  courseId: string;
  title: string;
  type: LessonType;
  status: 'completed' | 'current' | 'pending';
  duration: string;
  order: number;
  hasFeedback?: boolean;
}

/**
 * Lesson with both content and metadata
 */
export interface LessonData {
  content: LessonContent;
  metadata: LessonMetadata;
  nextLesson?: LessonMetadata;
  previousLesson?: LessonMetadata;
}

/**
 * Type guards for content types
 */
export function isIntroContent(content: LessonContent): content is IntroLessonContent {
  return content.type === 'intro';
}

export function isVideoContent(content: LessonContent): content is VideoLessonContent {
  return content.type === LessonType.Video;
}

export function isAudioContent(content: LessonContent): content is AudioLessonContent {
  return content.type === LessonType.Audio;
}

export function isArticleContent(content: LessonContent): content is ArticleLessonContent {
  return content.type === LessonType.Article || content.type === LessonType.Document;
}
