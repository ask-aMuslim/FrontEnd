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
    path: 'academy/lesson/:id',
    renderMode: RenderMode.Server,
  },
  // Events route with dynamic parameters - use server-side rendering
  {
    path: 'events/:id',
    renderMode: RenderMode.Server,
  },  // Academy main page - use server-side rendering
  {
    path: 'academy',
    renderMode: RenderMode.Server,
  },  // Routes that rely on client-only behavior or long-running calls - avoid prerender timeouts
  {
    path: 'events',
    renderMode: RenderMode.Server,
  },
  {
    path: 'ask-and-contact/ask-qa',
    renderMode: RenderMode.Server,
  },
  // Muslim Tube video detail with params - use server-side rendering
  {
    path: 'muslim-tube/video/:id',
    renderMode: RenderMode.Server,
  },
  // Muslim Tube channel detail with params - use server-side rendering
  {
    path: 'muslim-tube/channel/:id',
    renderMode: RenderMode.Server,
  },
  // Prerender all other routes (static pages like home, about, etc.)
  {
    path: '**',
    renderMode: RenderMode.Prerender,
  },
];
