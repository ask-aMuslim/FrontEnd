import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  // Roadmap routes with dynamic parameters - use server-side rendering
  {
    path: 'roadmap/course/:id',
    renderMode: RenderMode.Server,
  },
  {
    path: 'roadmap/course/:courseId/lesson/:lessonId',
    renderMode: RenderMode.Server,
  },
  {
    path: 'roadmap/lesson/:id',
    renderMode: RenderMode.Server,
  },
  // Events route with dynamic parameters - use server-side rendering
  {
    path: 'events/:id',
    renderMode: RenderMode.Server,
  },
  // Muslim Tube video detail with params - use server-side rendering
  {
    path: 'muslim-tube/video/:id',
    renderMode: RenderMode.Server,
  },
  // Prerender all other routes (static pages like home, about, etc.)
  {
    path: '**',
    renderMode: RenderMode.Prerender,
  },
];
