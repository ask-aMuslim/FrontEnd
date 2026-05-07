import { Routes } from '@angular/router';
import { NotFound } from './pages/not-found/not-found';
import { Home } from './pages/home/home';
import { authGuard, guestGuard } from './core/guards';
import { AuthLayoutComponent } from './core/layouts/auth-layout/auth-layout.component';
import { LoginComponent } from './core/auth/login/login.component';
import { RegisterComponent } from './core/auth/register/register.component';
import { AppLayoutComponent } from './core/layouts/app-layout/app-layout.component';
import { AskAndContactComponent } from './pages/ask-and-contact/ask-and-contact.component';
import { MuslimTubeComponent } from './pages/muslim-tube/muslim-tube.component';
import { VideoDetailComponent } from './pages/muslim-tube/video-detail/video-detail.component';
import { AcademyComponent } from './pages/academy/academy.component';
import { CourseComponent } from './pages/academy/course/course.component';
import { EventsComponent } from './pages/events/events.component';
import { EventDetailComponent } from './pages/events/event-detail/event-detail.component';
import { AccountComponent } from './pages/account/account.component';
import { ResetPasswordComponent } from './core/auth/reset-password/reset-password.component';
import { LessonOverviewComponent } from './pages/academy/lesson-overview/lesson-overview.component';
import { LessonPlayerComponent } from './pages/academy/lesson-player/lesson-player.component';
import { QuizComponent } from './pages/academy/quiz/quiz.component';
import { CongratulationsComponent } from './pages/academy/congratulations/congratulations.component';

const createQuestionAndAnswerRoutes = (): Routes => [
  { path: '', pathMatch: 'full', redirectTo: 'topics' },
  { path: 'ask-qa', pathMatch: 'full', redirectTo: 'topics' },
  {
    path: 'topics',
    loadComponent: () =>
      import('./pages/ask-and-contact/ask-Q&A/ask-qa.component').then(
        (m) => m.QuestionAndAnswerTopicsComponent,
      ),
    title: 'Ask Questions',
  },
  {
    path: 'topics/question',
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
      { path: 'home', component: Home, title: 'Home' },
      {
        path: 'about',
        loadComponent: () => import('./pages/about/about-page.component').then(m => m.AboutPageComponent),
        title: 'About',
      },
      {
        path: 'resources',
        loadComponent: () =>
          import('./pages/resources/resources-page.component').then(
            (m) => m.ResourcesPageComponent,
          ),
        title: 'Resources',
      },
      {
        path: 'question-and-answer',
        component: AskAndContactComponent,
        title: 'Question & Answer',
        children: createQuestionAndAnswerRoutes(),
      },
      {
        path: 'ask-and-contact',
        component: AskAndContactComponent,
        title: 'Ask & Contact',
        children: createQuestionAndAnswerRoutes(),
      },
      {
        path: 'muslim-tube',
        component: MuslimTubeComponent,
        title: 'Muslim Tube',
        children: [
          { path: '', pathMatch: 'full', redirectTo: 'channels' },
          {
            path: 'channels',
            loadComponent: () =>
              import('./pages/muslim-tube/channels/channels.component').then(
                (m) => m.ChannelsComponent,
              ),
            title: 'Channels',
          },
          {
            path: 'channel/:id',
            loadComponent: () =>
              import('./pages/muslim-tube/channel-detail/channel-detail.component').then(
                (m) => m.ChannelDetailComponent,
              ),
            title: 'Channel Detail',
          },
          {
            path: 'videos',
            loadComponent: () =>
              import('./pages/muslim-tube/videos/videos.component').then((m) => m.VideosComponent),
            title: 'Videos',
          },
          {
            path: 'video/:id',
            component: VideoDetailComponent,
            title: 'Video',
          },
          {
            path: 'shorts',
            loadComponent: () =>
              import('./pages/muslim-tube/shorts/shorts.component').then((m) => m.ShortsComponent),
            title: 'Shorts',
          },
          {
            path: 'saved',
            loadComponent: () =>
              import('./pages/muslim-tube/saved/saved.component').then((m) => m.SavedComponent),
            title: 'Saved',
          },
          {
            path: 'history',
            loadComponent: () =>
              import('./pages/muslim-tube/history/history.component').then(
                (m) => m.HistoryComponent,
              ),
            title: 'History',
          },
          {
            path: 'liked',
            loadComponent: () =>
              import('./pages/muslim-tube/liked/liked.component').then((m) => m.LikedComponent),
            title: 'Liked',
          },
        ],
      },
      {
        path: 'academy',
        canActivate: [authGuard],
        children: [
          { path: '', component: AcademyComponent, title: 'Academy' },
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
          {
            path: 'lesson/:id',
            component: LessonOverviewComponent,
            canActivate: [authGuard],
            title: 'Lesson Overview'
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
      { path: 'account', component: AccountComponent, title: 'Account', canActivate: [authGuard] },
    ],
  },

  // Not Found route
  { path: '**', component: NotFound, title: 'Page Not Found' },
];
