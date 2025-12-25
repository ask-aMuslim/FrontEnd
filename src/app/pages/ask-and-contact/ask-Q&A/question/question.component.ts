import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-question',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './question.component.html',
  styleUrl: './question.component.scss',
})
export class QuestionComponent {
  id = '';
  title = '';
  description = '';
  categories: string[] = [];
  saveIcon = '/icons/icons%2024/select=save.svg';
  savedIcon = '/icons/icons%2024/select=saved.svg';
  isSaved = false;
  shareIcon = '/icons/icons%2024/select=share.svg';
  eventImage = '/Images/placeholder.png';
  downloadIcon = '/icons/icons%2024/select=download.svg';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
  ) {
    this.route.queryParamMap.subscribe((params) => {
      this.id = params.get('id') ?? '';
      this.title = params.get('title') ?? '';
      this.description = params.get('description') ?? '';
      const cats = params.get('categories');
      this.categories = cats ? JSON.parse(cats) : [];
    });
  }

  back() {
    void this.router.navigate(['/ask-and-contact/ask-qa']);
  }

  toggleSave() {
    this.isSaved = !this.isSaved;
  }
}
