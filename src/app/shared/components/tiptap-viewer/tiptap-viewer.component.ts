import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  ErrorHandler,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import { Content, Editor, JSONContent } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import { TextStyle } from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import Image from '@tiptap/extension-image';
import TextAlign, { TextAlignOptions } from '@tiptap/extension-text-align';

@Component({
  selector: 'app-tiptap-viewer',
  standalone: true,
  templateUrl: './tiptap-viewer.component.html',
  styleUrls: ['./tiptap-viewer.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TiptapViewerComponent implements OnInit, OnChanges, OnDestroy {
  @Input() content: unknown = null;

  @ViewChild('editorHost', { static: true })
  private readonly editorHostRef!: ElementRef<HTMLDivElement>;

  editor: Editor | null = null;

  private lastContentFingerprint = '';

  constructor(private readonly errorHandler: ErrorHandler) { }

  ngOnInit(): void {
    const normalized = this.normalizeContent(this.content);
    this.lastContentFingerprint = this.createFingerprint(this.content);

    const textAlignOptions: Partial<TextAlignOptions> = {
      types: ['heading', 'paragraph'],
    };

    this.editor = new Editor({
      element: this.editorHostRef.nativeElement,
      extensions: [StarterKit, TextStyle, Color, Image, TextAlign.configure(textAlignOptions)],
      content: normalized,
      editable: false,
      injectCSS: false,
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (!('content' in changes) || !this.editor) {
      return;
    }

    const nextFingerprint = this.createFingerprint(this.content);
    if (nextFingerprint === this.lastContentFingerprint) {
      return;
    }

    this.lastContentFingerprint = nextFingerprint;
    const normalized = this.normalizeContent(this.content);
    this.editor.commands.setContent(normalized, { emitUpdate: false });
  }

  ngOnDestroy(): void {
    this.editor?.destroy();
    this.editor = null;
  }

  private createFingerprint(value: unknown): string {
    if (typeof value === 'string') {
      return value;
    }

    if (value === null || value === undefined) {
      return '';
    }

    try {
      return JSON.stringify(value);
    } catch {
      return '[unserializable-content]';
    }
  }

  private normalizeContent(value: unknown): Content {
    const emptyDoc: JSONContent = { type: 'doc', content: [] };

    if (value === null || value === undefined) {
      return emptyDoc;
    }

    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (!trimmed) {
        return emptyDoc;
      }

      const directHtml = this.tryExtractHtml(trimmed);
      if (directHtml) {
        return directHtml;
      }

      try {
        const parsed = JSON.parse(trimmed) as unknown;
        const normalizedDoc = this.normalizeStructuredDoc(parsed);
        if (normalizedDoc) {
          return normalizedDoc;
        }

        return this.buildFallbackDoc(trimmed);
      } catch (error) {
        this.errorHandler.handleError(error);
        return this.buildFallbackDoc(trimmed);
      }
    }

    const normalizedDoc = this.normalizeStructuredDoc(value);
    if (normalizedDoc) {
      return normalizedDoc;
    }

    return this.buildFallbackDoc(this.safeToString(value));
  }

  private normalizeStructuredDoc(value: unknown): JSONContent | string | null {
    if (value === null || value === undefined) {
      return null;
    }

    if (this.isTiptapDoc(value)) {
      return value;
    }

    if (Array.isArray(value)) {
      return {
        type: 'doc',
        content: value as JSONContent[],
      };
    }

    if (typeof value !== 'object') {
      return null;
    }

    const record = value as Record<string, unknown>;
    const directHtml = this.tryExtractHtml(typeof record['html'] === 'string' ? record['html'] : '');
    if (directHtml) {
      return directHtml;
    }

    if (typeof record['type'] === 'string') {
      return {
        type: 'doc',
        content: [value as JSONContent],
      };
    }

    if (Array.isArray(record['content'])) {
      return {
        type: 'doc',
        content: record['content'] as JSONContent[],
      };
    }

    return null;
  }

  private buildFallbackDoc(text: string): JSONContent {
    const lines = text
      .split(/\r?\n/)
      .map((line) => line.trimEnd())
      .filter((line) => line.length > 0);

    if (lines.length === 0) {
      return { type: 'doc', content: [] };
    }

    return {
      type: 'doc',
      content: lines.map((line) => ({
        type: 'paragraph',
        content: [{ type: 'text', text: line }],
      })),
    };
  }

  private isTiptapDoc(value: unknown): value is JSONContent {
    if (!value || typeof value !== 'object') {
      return false;
    }

    const maybeDoc = value as { type?: unknown };
    return maybeDoc.type === 'doc';
  }

  private safeToString(value: unknown): string {
    if (typeof value === 'string') {
      return value;
    }

    try {
      return JSON.stringify(value);
    } catch {
      return '[unserializable-content]';
    }
  }

  private tryExtractHtml(value: string): string | null {
    const trimmed = value.trim();
    if (!trimmed) {
      return null;
    }

    return /<\/?[a-z][\s\S]*>/i.test(trimmed) ? trimmed : null;
  }
}
