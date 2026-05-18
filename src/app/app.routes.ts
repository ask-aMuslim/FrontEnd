import { Routes } from '@angular/router';
import { NotFoundComponent } from './pages/not-found/not-found.component';
import { HomeComponent } from './pages/home/home.component';
import { authGuard, guestGuard } from './core/guards';
import { AuthLayoutComponent } from './core/layouts/auth-layout/auth-layout.component';
import { LoginComponent } from './core/auth/login/login.component';
import { RegisterComponent } from './core/auth/register/register.component';
import { AppLayoutComponent } from './core/layouts/app-layout/app-layout.component';
import { QuestionAndAnswerComponent } from './pages/question-and-answer/question-and-answer.component';
import { AcademyComponent } from './pages/academy/academy.component';
import { CourseComponent } from './pages/academy/course/course.component';
import { academyResolver } from './pages/academy/academy.resolver';
import { EventsComponent } from './pages/events/events.component';
import { EventDetailComponent } from './pages/events/event-detail/event-detail.component';
import { ProfileComponent } from './pages/profile/profile.component';
import { ResetPasswordComponent } from './core/auth/reset-password/reset-password.component';
import { LessonPlayerComponent } from './pages/academy/lesson-player/lesson-player.component';
import { QuizComponent } from './pages/academy/quiz/quiz.component';
import { CongratulationsComponent } from './pages/academy/congratulations/congratulations.component';

const createQuestionAndAnswerRoutes = (): Routes => [
  { path: '', pathMatch: 'full', redirectTo: 'topics' },
  {
    path: 'topics',
    loadComponent: () =>
      import('./pages/question-and-answer/ask-Q&A/ask-qa.component').then(
        (m) => m.AskQaComponent,
      ),
    title: 'Ask Questions',
  },
  {
    path: 'topics/question',
    loadComponent: () =>
      import('./pages/question-and-answer/ask-Q&A/question/question.component').then(
        (m) => m.QuestionComponent,
      ),
    title: 'Question',
  },
  {
    path: 'ask-assistant',
    loadComponent: () =>
      import('./pages/question-and-answer/ask-assistant/ask-assistant.component').then(
        (m) => m.AskAssistantComponent,
      ),
    title: 'Ask Assistant',
  },
  {
    path: 'meet-scholar',
    loadComponent: () =>
      import('./pages/question-and-answer/meet-scholar/meet-scholar.component').then(
        (m) => m.MeetScholarComponent,
      ),
    title: 'Meet Scholar',
  },
  {
    path: 'meet-scholar/success',
    loadComponent: () =>
      import(
        './pages/question-and-answer/meet-scholar/success/meet-scholar-success.component'
      ).then((m) => m.MeetScholarSuccessComponent),
    title: 'Meeting Request Submitted',
  },

];

export const routes: Routes = [
  // default route
  { path: '', redirectTo: '/home', pathMatch: 'full' },

  // Auth layout routes (guest only — redirect to /home if authenticated)
  {
    path: '',
    component: AuthLayoutComponent,
    canActivate: [guestGuard],
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
      { path: 'home', component: HomeComponent, title: 'Home' },
      {
        path: 'certificates',
        loadComponent: () => import('./pages/certificates/certificates.component').then(m => m.CertificatesComponent),
        title: 'Certificates of Achievement',
      },
      {
        path: 'certificates/:id',
        loadComponent: () => import('./pages/certificates/certificate-detail/certificate-detail.component').then(m => m.CertificateDetailComponent),
        title: 'Certificate Details',
      },
      {
        path: 'about',
        loadComponent: () => import('./pages/about/about.component').then(m => m.AboutComponent),
        title: 'About',
      },
      {
        path: 'resources',
        loadComponent: () =>
          import('./pages/resources/resources.component').then(
            (m) => m.ResourcesComponent,
          ),
        title: 'Resources',
      },
      {
        path: 'donation',
        loadComponent: () =>
          import('./pages/donation/donation.component').then(
            (m) => m.DonationComponent,
          ),
        title: 'Donate to Change Lives',
      },
      {
        path: 'question-and-answer',
        component: QuestionAndAnswerComponent,
        title: 'Question & Answer',
        children: createQuestionAndAnswerRoutes(),
      },


      {
        path: 'academy',
        canActivate: [authGuard],
        children: [
          { path: '', component: AcademyComponent, title: 'Academy', resolve: { academyData: academyResolver } },
          { path: 'course/:id', component: CourseComponent, title: 'Course' },
          {
            path: 'course/:courseId/lesson/:lessonId',
            component: LessonPlayerComponent,
            canActivate: [authGuard],
            title: 'Lesson Player',
          },
          {
            path: 'course/:courseId/quiz',
            component: QuizComponent,
            canActivate: [authGuard],
            title: 'Quiz',
          },
          {
            path: 'course/:courseId/quiz/:lessonId',
            component: QuizComponent,
            canActivate: [authGuard],
            title: 'Quiz',
          },
          {
            path: 'course/:courseId/congratulations',
            component: CongratulationsComponent,
            canActivate: [authGuard],
            title: 'Congratulations',
          },
        ],
      },
      {
        path: 'events',
        children: [
          { path: '', component: EventsComponent, title: 'Events' },
          { path: ':id', component: EventDetailComponent, title: 'Event Details' },
        ],
      },
      {
        path: 'forms',
        children: [
          {
            path: '',
            loadComponent: () =>
              import('./pages/forms/forms.component').then((m) => m.FormsComponent),
            title: 'Forms',
          },
          {
            path: ':id',
            loadComponent: () =>
              import('./pages/forms/form-detail/form-detail.component').then(
                (m) => m.FormDetailComponent,
              ),
            title: 'Form Details',
          },
        ],
      },
      {
        path: 'contact',
        loadComponent: () => import('./pages/contact/contact.component').then(m => m.ContactComponent),
        title: 'Contact Us',
      },
      { path: 'profile', component: ProfileComponent, title: 'Profile', canActivate: [authGuard] },
    ],
  },

  // Not Found route
  { path: '**', component: NotFoundComponent, title: 'Page Not Found' },
];
