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
import { EventsComponent } from './pages/events/events.component';
import { AccountComponent } from './pages/account/account.component';

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
              import('./pages/ask-and-contact/ask-Q&A/ask-qa/ask-qa.component').then(
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
      { path: 'roadmap', component: RoadmapComponent, title: 'Roadmap' },
      { path: 'events', component: EventsComponent, title: 'Events' },
      { path: 'account', component: AccountComponent, title: 'Account' },
    ],
  },

  // Not Found route
  { path: '**', component: NotFound, title: 'Page Not Found' },
];
