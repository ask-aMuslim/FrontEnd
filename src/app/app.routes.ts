import { Routes } from '@angular/router';
import { homeResolver } from './pages/home/home.resolver';
import { askQaResolver } from './pages/question-and-answer/ask-Q&A/ask-qa.resolver';
import { resourcesResolver } from './pages/resources/resources.resolver';
import { authGuard, guestGuard } from './core/guards';
import { academyResolver } from './pages/academy/academy.resolver';
import { courseResolver } from './pages/academy/course/course.resolver';
import { lessonPlayerResolver } from './pages/academy/lesson-player/lesson-player.resolver';
import { quizResolver } from './pages/academy/quiz/quiz.resolver';
import { congratulationsResolver } from './pages/academy/congratulations/congratulations.resolver';
import { donationResolver } from './pages/donation/donation.resolver';

const createQuestionAndAnswerRoutes = (): Routes => [
  { path: '', pathMatch: 'full', redirectTo: 'topics' },
  {
    path: 'topics',
    loadComponent: () =>
      import('./pages/question-and-answer/ask-Q&A/ask-qa.component').then(
        (m) => m.AskQaComponent,
      ),
    title: 'Ask Questions',
    resolve: { resolvedData: askQaResolver },
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
    loadComponent: () =>
      import('./core/layouts/auth-layout/auth-layout.component').then(
        (m) => m.AuthLayoutComponent,
      ),
    canActivate: [guestGuard],
    children: [
      {
        path: 'login',
        loadComponent: () =>
          import('./core/auth/login/login.component').then(
            (m) => m.LoginComponent,
          ),
        title: 'Login',
      },
      {
        path: 'register',
        loadComponent: () =>
          import('./core/auth/register/register.component').then(
            (m) => m.RegisterComponent,
          ),
        title: 'Register',
      },
      {
        path: 'reset-password',
        loadComponent: () =>
          import('./core/auth/reset-password/reset-password.component').then(
            (m) => m.ResetPasswordComponent,
          ),
        title: 'Reset Password',
      },
    ],
  },

  // App layout routes
  {
    path: '',
    loadComponent: () =>
      import('./core/layouts/app-layout/app-layout.component').then(
        (m) => m.AppLayoutComponent,
      ),
    children: [
      {
        path: 'home',
        loadComponent: () =>
          import('./pages/home/home.component').then(
            (m) => m.HomeComponent,
          ),
        title: 'Home',
        resolve: { homeData: homeResolver },
      },
      {
        path: 'certificates',
        loadComponent: () =>
          import('./pages/certificates/certificates.component').then(
            (m) => m.CertificatesComponent,
          ),
        title: 'Certificates of Achievement',
      },
      {
        path: 'certificates/:id',
        loadComponent: () =>
          import('./pages/certificates/certificate-detail/certificate-detail.component').then(
            (m) => m.CertificateDetailComponent,
          ),
        title: 'Certificate Details',
      },
      {
        path: 'about',
        loadComponent: () =>
          import('./pages/about/about.component').then(
            (m) => m.AboutComponent,
          ),
        title: 'About',
      },
      {
        path: 'resources',
        loadComponent: () =>
          import('./pages/resources/resources.component').then(
            (m) => m.ResourcesComponent,
          ),
        title: 'Resources',
        resolve: { resolvedData: resourcesResolver },
      },
      {
        path: 'mosques/:id',
        loadComponent: () =>
          import('./pages/mosques/mosque-detail/mosque-detail.component').then(
            (m) => m.MosqueDetailComponent,
          ),
        title: 'Mosque Details',
      },
      {
        path: 'mosques',
        loadComponent: () =>
          import('./pages/mosques/mosques.component').then((m) => m.MosquesComponent),
        title: 'Mosques',
      },
       {
         path: 'donate',
         loadComponent: () =>
           import('./pages/donation/donation.component').then(
             (m) => m.DonationComponent,
           ),
         title: 'Donate to Change Lives',
         resolve: { donationUrl: donationResolver },
       },
      {
        path: 'question-and-answer',
        loadComponent: () =>
          import('./pages/question-and-answer/question-and-answer.component').then(
            (m) => m.QuestionAndAnswerComponent,
          ),
        title: 'Question & Answer',
        children: createQuestionAndAnswerRoutes(),
      },

      {
        path: 'academy',
        canActivate: [authGuard],
        children: [
          {
            path: '',
            loadComponent: () =>
              import('./pages/academy/academy.component').then(
                (m) => m.AcademyComponent,
              ),
            title: 'Academy',
            resolve: { academyData: academyResolver },
          },
          {
            path: 'course/:id',
            loadComponent: () =>
              import('./pages/academy/course/course.component').then(
                (m) => m.CourseComponent,
              ),
            title: 'Course',
            resolve: { resolvedData: courseResolver },
          },
          {
            path: 'course/:courseId/lesson/:lessonId',
            loadComponent: () =>
              import('./pages/academy/lesson-player/lesson-player.component').then(
                (m) => m.LessonPlayerComponent,
              ),
            canActivate: [authGuard],
            title: 'Lesson Player',
            resolve: { resolvedData: lessonPlayerResolver },
          },
          {
            path: 'course/:courseId/quiz',
            loadComponent: () =>
              import('./pages/academy/quiz/quiz.component').then(
                (m) => m.QuizComponent,
              ),
            canActivate: [authGuard],
            title: 'Quiz',
            resolve: { resolvedQuizData: quizResolver },
          },
          {
            path: 'course/:courseId/quiz/:lessonId',
            loadComponent: () =>
              import('./pages/academy/quiz/quiz.component').then(
                (m) => m.QuizComponent,
              ),
            canActivate: [authGuard],
            title: 'Quiz',
            resolve: { resolvedQuizData: quizResolver },
          },
          {
            path: 'course/:courseId/congratulations',
            loadComponent: () =>
              import('./pages/academy/congratulations/congratulations.component').then(
                (m) => m.CongratulationsComponent,
              ),
            canActivate: [authGuard],
            title: 'Congratulations',
            resolve: { resolvedCongratulationsData: congratulationsResolver },
          },
        ],
      },
      {
        path: 'events',
        children: [
          {
            path: '',
            loadComponent: () =>
              import('./pages/events/events.component').then(
                (m) => m.EventsComponent,
              ),
            title: 'Events',
          },
          {
            path: ':id',
            loadComponent: () =>
              import('./pages/events/event-detail/event-detail.component').then(
                (m) => m.EventDetailComponent,
              ),
            title: 'Event Details',
          },
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
        loadComponent: () =>
          import('./pages/contact/contact.component').then(
            (m) => m.ContactComponent,
          ),
        title: 'Contact Us',
      },
      {
        path: 'profile',
        loadComponent: () =>
          import('./pages/profile/profile.component').then(
            (m) => m.ProfileComponent,
          ),
        title: 'Profile',
        canActivate: [authGuard],
      },
    ],
  },

  // Not Found route
  {
    path: '**',
    loadComponent: () =>
      import('./pages/not-found/not-found.component').then(
        (m) => m.NotFoundComponent,
      ),
    title: 'Page Not Found',
  },
];
