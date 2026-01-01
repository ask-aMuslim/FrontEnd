import { Routes } from '@angular/router';
import { NotFound } from './pages/not-found/not-found';
import { Home } from './pages/home/home';
import { AuthLayoutComponent } from './core/Layouts/auth-layout/auth-layout.component';
import { LoginComponent } from './core/auth/login/login.component';
import { RegisterComponent } from './core/auth/register/register.component';
import { AppLayoutComponent } from './core/Layouts/app-layout/app-layout.component';
import { AskAndContactComponent } from './pages/ask-and-contact/ask-and-contact.component';
import { MuslimTubeComponent } from './pages/muslim-tube/muslim-tube.component';
import { RoadmapComponent } from './pages/roadmap/roadmap.component';
import { CourseComponent } from './pages/roadmap/course/course.component';
import { EventsComponent } from './pages/events/events.component';
import { EventDetailComponent } from './pages/events/event-detail/event-detail.component';
import { AccountComponent } from './pages/account/account.component';
import { ResetPasswordComponent } from './core/auth/reset-password/reset-password.component';
import { LessonOverviewComponent } from './pages/roadmap/lesson-overview/lesson-overview.component';
import { LessonPlayerComponent } from './pages/roadmap/lesson-player/lesson-player.component';

export const routes: Routes = [
  // default route
  { path: '', redirectTo: '/home', pathMatch: 'full' },

  // Auth layout routes
  {
    path: '',
    component: AuthLayoutComponent,
    children: [
      { path: 'login', component: LoginComponent, title: 'Login' },
      { path: 'register', component: RegisterComponent, title: 'Register' },
      { path: 'reset-password', component: ResetPasswordComponent, title: 'Reset Password' },
    ],
  },

  // App layout routes
  {
    path: '',
    component: AppLayoutComponent,
    children: [
      { path: 'home', component: Home, title: 'Home' },
      {
        path: 'ask-and-contact',
        component: AskAndContactComponent,
        title: 'Ask & Contact',
        children: [
          { path: '', pathMatch: 'full', redirectTo: 'ask-qa' },
          {
            path: 'ask-qa',
            loadComponent: () =>
              import('./pages/ask-and-contact/ask-Q&A/ask-qa.component').then(
                (m) => m.AskQaComponent,
              ),
            title: 'Ask "Q&A"',
          },
          {
            path: 'ask-qa/question',
            loadComponent: () =>
              import('./pages/ask-and-contact/ask-Q&A/question/question.component').then(
                (m) => m.QuestionComponent,
              ),
            title: 'Question',
          },
          {
            path: 'ask-assistant',
            loadComponent: () =>
              import('./pages/ask-and-contact/ask-assistant/ask-assistant.component').then(
                (m) => m.AskAssistantComponent,
              ),
            title: 'Ask Assistant',
          },
          {
            path: 'meet-scholar',
            loadComponent: () =>
              import('./pages/ask-and-contact/meet-scholar/meet-scholar.component').then(
                (m) => m.MeetScholarComponent,
              ),
            title: 'Meet Scholar',
          },
          {
            path: 'meet-scholar/success',
            loadComponent: () =>
              import(
                './pages/ask-and-contact/meet-scholar/success/meet-scholar-success.component'
              ).then((m) => m.MeetScholarSuccessComponent),
            title: 'Meeting Request Submitted',
          },
          {
            path: 'send-inquiry/success',
            loadComponent: () =>
              import(
                './pages/ask-and-contact/send-inquiry/success/send-inquiry-success.component'
              ).then((m) => m.SendInquirySuccessComponent),
            title: 'Inquiry Sent',
          },
          {
            path: 'send-inquiry',
            loadComponent: () =>
              import('./pages/ask-and-contact/send-inquiry/send-inquiry.component').then(
                (m) => m.SendInquiryComponent,
              ),
            title: 'Send Inquiry',
          },
        ],
      },
      { path: 'muslim-tube', component: MuslimTubeComponent, title: 'Muslim Tube' },
      {
        path: 'roadmap',
        children: [
          { path: '', component: RoadmapComponent, title: 'Roadmap' },
          { path: 'course/:id', component: CourseComponent, title: 'Course' },
          {
            path: 'course/:courseId/lesson/:lessonId',
            component: LessonPlayerComponent,
            title: 'Lesson Player',
          },
          { path: 'lesson/:id', component: LessonOverviewComponent, title: 'Lesson Overview' },
        ],
      },
      {
        path: 'events',
        children: [
          { path: '', component: EventsComponent, title: 'Events' },
          { path: ':id', component: EventDetailComponent, title: 'Event Details' },
        ],
      },
      { path: 'account', component: AccountComponent, title: 'Account' },
    ],
  },

  // Not Found route
  { path: '**', component: NotFound, title: 'Page Not Found' },
];
