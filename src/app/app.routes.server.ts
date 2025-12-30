import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  // Roadmap routes with dynamic parameters - use client-side rendering for UI development
  {
    path: 'roadmap/course/:id',
    renderMode: RenderMode.Client
  },
  {
    path: 'roadmap/course/:courseId/lesson/:lessonId',
    renderMode: RenderMode.Client
  },
  {
    path: 'roadmap/lesson/:id',
    renderMode: RenderMode.Client
  },
  // Prerender all other routes (static pages like home, about, etc.)
  {
    path: '**',
    renderMode: RenderMode.Prerender
  }
];
