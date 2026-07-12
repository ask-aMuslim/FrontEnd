import { Pipe, PipeTransform } from '@angular/core';

/**
 * Converts a description string to plain text by:
 * - Handling TipTap JSON content strings and extracting text with block spacing
 * - Converting HTML block tags to spaces before stripping
 * - Restoring spaces at concatenated boundaries (e.g., "God“The", "5:75).The", "JesusIslam")
 * - Converting newlines and other whitespace to single spaces
 * - Trimming the result
 */
@Pipe({
  name: 'description',
  standalone: true,
  pure: true,
})
export class DescriptionPipe implements PipeTransform {
  transform(value: string | null | undefined): string {
    if (!value?.trim()) {
      return '';
    }

    const trimmed = value.trim();

    // Check if it is a JSON string (TipTap JSON structure)
    if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
      try {
        const parsed = JSON.parse(trimmed);
        return this.extractTextFromTiptapJson(parsed).replace(/\s+/g, ' ').trim();
      } catch {
        // Fallback to HTML/text parsing if JSON parsing fails
      }
    }

    // Convert HTML block tags to spaces to ensure spacing between blocks
    const htmlConverted = trimmed
      .replace(/<\/(p|h1|h2|h3|h4|h5|h6|div|blockquote|li|tr|td)>/gi, ' ')
      .replace(/<br\s*\/?>/gi, ' ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/&nbsp;/g, ' ');

    // Restore missing spaces at block-level concatenation boundaries
    const restoredText = htmlConverted
      // 1. Lowercase followed by uppercase (e.g., JesusIslam -> Jesus Islam)
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      // 2. Word/number/punctuation followed by opening quote/bracket (e.g., God“The -> God “The)
      .replace(/([a-zA-Z0-9\.\?!,\)])([“"\[\(])/g, '$1 $2')
      // 3. Closing quote/bracket followed by word/number (e.g., Messiah”Islam -> Messiah” Islam)
      .replace(/([”"\]\)])([a-zA-Z0-9])/g, '$1 $2')
      // 4. Punctuation followed by word/number (e.g., 5:75).The -> 5:75). The)
      .replace(/([\.\?!])([a-zA-Z0-9])/g, '$1 $2');

    return restoredText.replace(/\s+/g, ' ').trim();
  }

  private extractTextFromTiptapJson(node: any): string {
    if (!node) {
      return '';
    }
    if (node.type === 'text') {
      return node.text || '';
    }
    if (node.content && Array.isArray(node.content)) {
      const childrenText = node.content.map((child: any) => this.extractTextFromTiptapJson(child));
      const isBlock = [
        'doc',
        'paragraph',
        'heading',
        'blockquote',
        'bulletList',
        'orderedList',
        'listItem',
        'table',
        'tableRow',
        'tableCell',
      ].includes(node.type);

      if (isBlock) {
        return childrenText.join('').trim() + ' ';
      } else {
        return childrenText.join('');
      }
    }
    return '';
  }
}