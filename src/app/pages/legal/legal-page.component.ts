import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import {
  DELETE_ACCOUNT,
  LAST_UPDATED,
  LegalDocument,
  PRIVACY_POLICY,
  SUPPORT_EMAIL,
  TERMS_OF_USE,
} from './legal-content';

const DOCS: Record<string, LegalDocument> = {
  'privacy-policy': PRIVACY_POLICY,
  'terms-of-use': TERMS_OF_USE,
  'delete-account': DELETE_ACCOUNT,
};

@Component({
  selector: 'app-legal-page',
  standalone: true,
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main class="legal">
      <h1>{{ doc.title }}</h1>
      <p class="meta">Ask A Muslim Inc · Last updated {{ updated }}</p>
      <p>{{ doc.intro }}</p>
      @for (s of doc.sections; track s.heading) {
        <section>
          <h2>{{ s.heading }}</h2>
          @for (p of s.paragraphs ?? []; track p) {
            <p>{{ p }}</p>
          }
          @if (s.items) {
            <ul>
              @for (i of s.items; track i) {
                <li>{{ i }}</li>
              }
            </ul>
          }
        </section>
      }
      <nav class="related" aria-label="Related pages">
        @if (slug !== 'privacy-policy') {
          <a routerLink="/privacy-policy">Privacy Policy</a>
        }
        @if (slug !== 'terms-of-use') {
          <a routerLink="/terms-of-use">Terms of Use</a>
        }
        @if (slug !== 'delete-account') {
          <a routerLink="/delete-account">Delete Account</a>
        }
        <a [href]="'mailto:' + email">{{ email }}</a>
      </nav>
    </main>
  `,
  styles: `
    .legal {
      max-width: 800px;
      margin: 0 auto;
      padding: 48px 20px 64px;
      line-height: 1.7;
      color: var(--colors-rare-grays-80);
    }
    h1 { font-size: 2rem; margin: 0 0 4px; }
    h2 { font-size: 1.25rem; margin: 32px 0 8px; }
    .meta { color: var(--colors-rare-grays-60); font-size: 0.875rem; margin-bottom: 24px; }
    ul { padding-inline-start: 20px; }
    li { margin-bottom: 8px; }
    .related {
      display: flex; flex-wrap: wrap; gap: 20px;
      margin-top: 40px; padding-top: 20px;
      border-top: 1px solid var(--colors-rare-grays-50);
    }
    .related a { color: var(--special-primary); font-weight: 600; }
  `,
})
export class LegalPageComponent {
  protected readonly slug: string = inject(ActivatedRoute).snapshot.data['doc'];
  protected readonly doc = DOCS[this.slug];
  protected readonly email = SUPPORT_EMAIL;
  protected readonly updated = LAST_UPDATED;
}

