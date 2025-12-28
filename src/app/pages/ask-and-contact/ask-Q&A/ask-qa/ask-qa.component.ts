import { CommonModule, NgFor, NgIf } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { QA_CATEGORIES, PAGINATION } from '../../constants/ask-qa.constants';
import { QuestionSearchResultComponent } from '../question-search-result/question-search-result.component';
import { QaCardComponent, QuestionCard } from '../qa-card/qa-card.component';

@Component({
  selector: 'app-ask-qa',
  standalone: true,
  imports: [CommonModule, NgIf, NgFor, FormsModule, QaCardComponent, QuestionSearchResultComponent],
  templateUrl: './ask-qa.component.html',
  styleUrl: './ask-qa.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AskQaComponent {
  readonly categories = QA_CATEGORIES;
  selectedCategory = 0;
  currentPage = PAGINATION.DEFAULT_PAGE;
  readonly pages = [1, 2, 3];
  searchQuery = '';
  hasSearched = false;
  searchResults: QuestionCard[] = [];

  readonly questions: QuestionCard[] = [
    {
      categories: ['Prayer & Worship'],
      id: 'Q-1453',
      title: 'How can I improve khushu during prayer?',
      description:
        'Khushu, or humility and presence of heart in prayer, is essential for a meaningful Salah. To improve it, start by praying on time so you are not rushed. Slow down your recitation and contemplate the meanings of what you recite. Before praying, remove distractions such as your phone, loud noises, or hunger. Make wudu mindfully, and choose a clean, quiet spot. Imagine yourself standing before Allah, seeking His mercy and guidance. Reflect on the greatness of Allah during ruku and sujood, and avoid letting your mind wander to worldly affairs. Consistency and sincere intention will gradually deepen your focus and devotion.',
      sameQuestions: 5,
    },
    {
      categories: ['Quran & Hadith'],
      id: 'Q-1454',
      title: 'What is the best way to start memorizing Quran?',
      description:
        'Beginning Quran memorization requires dedication, consistency, and proper methodology. Start with short surahs from Juz Amma, as they are easier to memorize and frequently recited in prayer. Use a single Mushaf (Quran copy) so your visual memory aids retention. Recite each new verse repeatedly until you can say it from memory, then combine it with previous verses. Recite to a qualified teacher or use technology to ensure correct tajweed and pronunciation. Set a daily goal, even if it is just a few lines, and review what you have memorized regularly to prevent forgetting. Make dua for Allah to make it easy, and be patient with yourself. Memorization is a journey that brings immense blessings.',
      sameQuestions: 4,
    },
    {
      categories: ['Fasting', 'Modern Challenges'],
      id: 'Q-1455',
      title: 'Does a medical inhaler break the fast?',
      description:
        'The use of a medical inhaler during fasting is a contemporary issue that scholars have addressed with care. The majority opinion is that using an inhaler does not break the fast because the medication is delivered directly to the lungs to facilitate breathing, and it does not reach the stomach or provide nourishment. Asthma and similar respiratory conditions can be serious, and Islam provides ease for those with medical needs. However, if you can delay using the inhaler until after iftar without harm, that is preferable. Always consult both your doctor to ensure your health is not at risk and your local imam or scholar for guidance that considers your specific madhab and circumstances.',
      sameQuestions: 2,
    },
    {
      categories: ['Family & Relationships'],
      id: 'Q-1456',
      title: 'How do I handle conflicts with parents respectfully?',
      description:
        'Respecting and honoring parents is a fundamental principle in Islam, emphasized repeatedly in the Quran and Hadith. When conflicts arise, approach them with patience, humility, and kindness. Keep your tone soft and avoid raising your voice or speaking harshly, even if you feel frustrated or misunderstood. Choose calm moments to discuss issues rather than when emotions are high. Listen actively to their perspective and try to understand their concerns. If direct communication is difficult, seek the help of a trusted family member or community elder to mediate. Always make dua for your parents and remember that Allah commands kindness to them, especially as they age. Even when you disagree, express your views respectfully and seek common ground.',
      sameQuestions: 6,
    },
    {
      categories: ['Islamic History'],
      id: 'Q-1457',
      title: 'What made the Treaty of Hudaybiyyah pivotal?',
      description:
        'The Treaty of Hudaybiyyah, signed in 6 AH (628 CE), was a turning point in Islamic history. Though it initially seemed unfavorable to the Muslims, Allah described it in the Quran as a "clear victory." The treaty established a ten-year truce between the Muslims and the Quraysh of Makkah, halting hostilities and allowing both sides to interact peacefully. This period of peace enabled the Prophet Muhammad (peace be upon him) to spread the message of Islam without the constant threat of war. Many tribes and individuals who had been observing from a distance now had the opportunity to learn about Islam, leading to a significant increase in conversions. Within two years, the Muslim community grew substantially in number and strength, ultimately leading to the peaceful conquest of Makkah in 8 AH. The treaty demonstrated the importance of strategic patience, diplomacy, and trust in Allah\'s wisdom.',
      sameQuestions: 3,
    },
    {
      categories: ['Comparative Religion'],
      id: 'Q-1458',
      title: 'How do Muslims view Jesus (Isa)?',
      description:
        "Muslims hold Jesus (Isa in Arabic), peace be upon him, in the highest regard as one of the greatest prophets and messengers of Allah. He is mentioned by name 25 times in the Quran, more than Prophet Muhammad (peace be upon him). Muslims believe Jesus was born miraculously to the Virgin Mary (Maryam) without a father, through the will of Allah, similar to how Adam was created. Jesus performed many miracles by Allah's permission, including healing the sick, giving sight to the blind, and raising the dead. He called people to worship Allah alone and follow His commandments. However, Muslims do not believe Jesus is divine, the son of God, or part of a trinity. They also reject the crucifixion, believing instead that Allah raised Jesus to the heavens and that he will return before the Day of Judgment. Love and respect for Jesus is an integral part of Islamic faith.",
      sameQuestions: 7,
    },
    {
      categories: ['Prayer & Worship', 'Modern Challenges'],
      id: 'Q-1459',
      title: 'Can I pray sitting when my office has no clean space?',
      description:
        'Finding a clean space for prayer in a workplace can be challenging, but Islam provides flexibility for difficult situations. If you genuinely cannot find a clean area after making a reasonable effort, you may pray while seated at your desk or in your chair. In this case, perform the movements of prayer to the best of your ability—bowing for ruku and nodding or lowering your head further for sujood. If you are able to place something clean on the floor or find even a small clean spot, that would be better. Some scholars also permit using a prayer mat over an impure surface if the impurity does not seep through. If you are uncertain whether the area is truly impure or if you had to pray in a compromised situation, you can make up the prayer later at home with proper conditions. The key is to make sincere effort and trust that Allah knows your circumstances.',
      sameQuestions: 1,
    },
    {
      categories: ['Family & Relationships', 'Modern Challenges'],
      id: 'Q-1460',
      title: 'Is digital nikah valid?',
      description:
        "The question of digital nikah (Islamic marriage contract conducted online) has become relevant in our modern era, especially during circumstances like the COVID-19 pandemic or when families live far apart. The fundamental requirements for a valid nikah remain unchanged: there must be a clear proposal (ijab) and acceptance (qabul), the presence of witnesses (typically two Muslim men or one man and two women), and the involvement of the bride's guardian (wali) where required by Islamic law. Many contemporary scholars accept digital nikah as valid when all these conditions are properly met through video conferencing, where all parties can see and hear each other in real-time. However, some scholars prefer in-person ceremonies when possible. The contract must be witnessed, documented, and announced publicly. It is crucial to consult with a knowledgeable Islamic authority in your area to ensure all legal and religious requirements are fulfilled.",
      sameQuestions: 3,
    },
    {
      categories: ['Zakat & Charity'],
      id: 'Q-1461',
      title: 'How do I calculate zakat on salary?',
      description:
        'Calculating zakat on salary requires understanding the principles of nisab (minimum threshold) and hawl (one lunar year). Zakat is not paid on income itself but on accumulated savings that meet certain conditions. Track your savings each month after covering necessary expenses like housing, food, and bills. If your total savings reach the nisab threshold—equivalent to the value of 85 grams of gold or 595 grams of silver—and remain at or above that amount for one complete lunar year (hawl), then you owe zakat. Calculate 2.5% of your total savings at that point and distribute it to eligible recipients. Money that fluctuates below nisab during the year does not require zakat. Keep records of when your savings first reached nisab to determine your annual zakat date. Some scholars also permit paying zakat monthly if it makes distribution easier, though the traditional method is annual.',
      sameQuestions: 4,
    },
    {
      categories: ['Hajj & Umrah'],
      id: 'Q-1462',
      title: 'What breaks ihram during Umrah?',
      description:
        'Ihram is the sacred state a Muslim enters when performing Hajj or Umrah, marked by specific intentions and restrictions. Several actions are prohibited while in ihram and can break or violate this state. These include: cutting or removing hair from any part of the body, trimming or cutting nails, using scented products like perfume or scented soap, covering the head (for men), wearing stitched garments (for men), hunting or killing animals, and engaging in marital relations or anything leading to it. If any of these prohibitions are violated, the person may need to offer a penalty (fidyah), which could be sacrificing an animal, fasting, or feeding the poor, depending on the nature and severity of the violation. The specific compensation varies based on the act and whether it was done intentionally or out of ignorance. It is essential to consult a qualified scholar or guide to determine the appropriate expiation if you believe you have violated ihram.',
      sameQuestions: 2,
    },
  ];
  arrowRightIcon = '/icons/icons-24/arrow-right.svg';
  arrowLeftIcon = '/icons/icons-24/arrow-left.svg';

  constructor(
    private readonly route: ActivatedRoute,
    private readonly cdr: ChangeDetectorRef,
  ) {
    const initialQuery = this.route.snapshot.queryParamMap.get('question');
    if (initialQuery) {
      this.searchQuery = initialQuery;
      this.onSearch();
    }
  }

  get isShowingResults(): boolean {
    return this.hasSearched && this.searchQuery.trim().length > 0;
  }

  get filteredQuestions(): QuestionCard[] {
    if (this.selectedCategory === 0) {
      return this.questions;
    }
    const selectedCategoryName = this.categories[this.selectedCategory];
    return this.questions.filter((question) => question.categories.includes(selectedCategoryName));
  }

  onSearch(): void {
    const query = this.searchQuery.trim();
    if (!query) {
      this.clearSearch();
      return;
    }

    const normalizedQuery = query.toLowerCase();
    this.searchResults = this.questions.filter((question) =>
      this.matchesQuery(question, normalizedQuery),
    );
    this.hasSearched = true;
  }

  clearSearch(): void {
    this.searchQuery = '';
    this.searchResults = [];
    this.hasSearched = false;
  }

  selectCategory(index: number): void {
    this.selectedCategory = index;
    this.cdr.markForCheck();
  }

  goToPage(page: number): void {
    if (!Number.isFinite(page)) return;
    const maxPage = this.pages.length || PAGINATION.DEFAULT_PAGE;
    this.currentPage = Math.min(
      Math.max(page, PAGINATION.MIN_PAGE),
      maxPage,
    ) as typeof this.currentPage;
  }

  prevPage(): void {
    this.goToPage(this.currentPage - 1);
  }

  nextPage(): void {
    this.goToPage(this.currentPage + 1);
  }

  trackByIndex(index: number): number {
    return index;
  }

  trackByQuestionId(index: number, question: QuestionCard): string {
    return question.id;
  }

  private matchesQuery(question: QuestionCard, normalizedQuery: string): boolean {
    return (
      question.title.toLowerCase().includes(normalizedQuery) ||
      question.description.toLowerCase().includes(normalizedQuery) ||
      question.categories.some((category) => category.toLowerCase().includes(normalizedQuery))
    );
  }
}
