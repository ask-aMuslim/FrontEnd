export function formatEventDateDisplay(value: string | null): string {
    if (!value) {
        return 'TBD';
    }

    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
        return value;
    }

    return new Intl.DateTimeFormat('en-US', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    }).format(parsed);
}

export function formatEventTimeRangeDisplay(startValue: string | null, endValue: string | null): string {
    const start = parseDate(startValue);
    const end = parseDate(endValue);

    if (!start && !end) {
        return 'TBD';
    }

    if (start && end) {
        return `${formatTime(start)} - ${formatTime(end)}`;
    }

    if (start) {
        return formatTime(start);
    }

    return formatTime(end as Date);
}

function parseDate(value: string | null): Date | null {
    if (!value) {
        return null;
    }

    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function formatTime(value: Date): string {
    return new Intl.DateTimeFormat('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
    }).format(value);
}