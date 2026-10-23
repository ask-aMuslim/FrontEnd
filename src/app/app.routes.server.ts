import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  // Academy routes with dynamic parameters - use server-side rendering
  {
    path: 'academy/course/:id',
    renderMode: RenderMode.Server,
  },
  {
    path: 'academy/course/:courseId/lesson/:lessonId',
    renderMode: RenderMode.Server,
  },
  {
    path: 'academy/course/:courseId/quiz',
    renderMode: RenderMode.Server,
  },
  {
    path: 'academy/course/:courseId/quiz/:lessonId',
    renderMode: RenderMode.Server,
  },
  {
    path: 'academy/course/:courseId/congratulations',
    renderMode: RenderMode.Server,
  },

  // Events route with dynamic parameters - use server-side rendering
  {
    path: 'events/:id',
    renderMode: RenderMode.Server,
  },  // Academy main page - client-side rendering with resolver
  {
    path: 'academy',
    renderMode: RenderMode.Client,
  },  // Routes that rely on client-only behavior or long-running calls - avoid prerender timeouts
  {
    path: 'events',
    renderMode: RenderMode.Server,
  },
  {
    path: 'question-and-answer/topics',
    renderMode: RenderMode.Server,
  },
  {
    path: 'question-and-answer/topics/question',
    renderMode: RenderMode.Server,
  },
  {
    path: 'question-and-answer/ask-assistant',
    renderMode: RenderMode.Server,
  },
  {
    path: 'question-and-answer/meet-scholar',
    renderMode: RenderMode.Server,
  },
  {
    path: 'question-and-answer/meet-scholar/success',
    renderMode: RenderMode.Server,
  },
  // Signed-in meeting history: private, rendered in the browser only
  {
    path: 'question-and-answer/meet-scholar/history',
    renderMode: RenderMode.Client,
  },
  {
    path: 'question-and-answer/meet-scholar/history/:id',
    renderMode: RenderMode.Client,
  },
  // Signed-in Support Mails pages: private, rendered in the browser only
  {
    path: 'contact/mails',
    renderMode: RenderMode.Client,
  },
  {
    path: 'contact/mails/:id',
    renderMode: RenderMode.Client,
  },



  // Prerender all other routes (static pages like home, about, etc.)
  {
    path: '**',
    renderMode: RenderMode.Prerender,
  },
];
