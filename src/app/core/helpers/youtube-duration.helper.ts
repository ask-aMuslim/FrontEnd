interface YouTubeVideoDetailsResponse {
    items?: Array<{
        contentDetails?: {
            duration?: string;
        };
    }>;
}

const durationIsoCache = new Map<string, string>();
const pendingDurationRequests = new Map<string, Promise<string>>();

export function extractVideoId(url: string): string | null {
    const normalized = url.trim();
    if (!normalized) {
        return null;
    }

    const directIdMatch = /^[a-zA-Z0-9_-]{11}$/.exec(normalized);
    if (directIdMatch?.[0]) {
        return directIdMatch[0];
    }

    const parsedUrl = tryParseUrl(normalized);
    if (!parsedUrl) {
        return null;
    }

    const hostname = parsedUrl.hostname.replace(/^www\./, '');
    if (hostname === 'youtu.be') {
        return toCanonicalVideoId(parsedUrl.pathname.split('/').find(Boolean) ?? null);
    }

    const isYouTubeHost = hostname === 'youtube.com'
        || hostname === 'm.youtube.com'
        || hostname === 'youtube-nocookie.com';

    if (!isYouTubeHost) {
        return null;
    }

    const pathPrefixes = ['/embed/', '/live/', '/shorts/'];
    for (const pathPrefix of pathPrefixes) {
        if (!parsedUrl.pathname.startsWith(pathPrefix)) {
            continue;
        }

        const pathVideoId = parsedUrl.pathname.slice(pathPrefix.length).split('/')[0] ?? null;
        return toCanonicalVideoId(pathVideoId);
    }

    return toCanonicalVideoId(parsedUrl.searchParams.get('v'));
}

export async function fetchVideoDuration(videoId: string, apiKey: string): Promise<string> {
    const canonicalVideoId = toCanonicalVideoId(videoId);
    if (!canonicalVideoId) {
        throw new Error('Invalid YouTube video ID.');
    }

    const normalizedApiKey = apiKey.trim();
    if (!normalizedApiKey) {
        throw new Error('Missing YouTube API key.');
    }

    const cachedDuration = durationIsoCache.get(canonicalVideoId);
    if (cachedDuration) {
        return cachedDuration;
    }

    const pendingRequest = pendingDurationRequests.get(canonicalVideoId);
    if (pendingRequest) {
        return pendingRequest;
    }

    const requestPromise = (async () => {
        const endpoint = `https://www.googleapis.com/youtube/v3/videos?part=contentDetails&id=${encodeURIComponent(canonicalVideoId)}&key=${encodeURIComponent(normalizedApiKey)}`;
        const response = await fetch(endpoint);

        if (!response.ok) {
            throw new Error(`YouTube API request failed with status ${response.status}.`);
        }

        const payload = (await response.json()) as YouTubeVideoDetailsResponse;
        const isoDuration = payload.items?.[0]?.contentDetails?.duration?.trim() ?? '';

        if (!isoDuration) {
            throw new Error('Missing contentDetails.duration in YouTube API response.');
        }

        durationIsoCache.set(canonicalVideoId, isoDuration);
        return isoDuration;
    })();

    pendingDurationRequests.set(canonicalVideoId, requestPromise);

    try {
        return await requestPromise;
    } finally {
        pendingDurationRequests.delete(canonicalVideoId);
    }
}

export function formatDuration(isoDuration: string): string {
    const totalSeconds = parseIsoDurationToSeconds(isoDuration);
    if (totalSeconds <= 0) {
        return '00:00';
    }

    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (hours > 0) {
        return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    }

    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

export function renderDuration(duration: string): string {
    const normalized = duration.trim();
    return normalized.length > 0 ? normalized : '00:00';
}

export function parseIsoDurationToSeconds(isoDuration: string): number {
    const normalized = isoDuration.trim().toUpperCase();
    if (!normalized.startsWith('P')) {
        return 0;
    }

    const durationRegex = /^P(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?)?$/;
    const match = durationRegex.exec(normalized);
    if (!match) {
        return 0;
    }

    const days = Number(match[1] ?? '0');
    const hours = Number(match[2] ?? '0');
    const minutes = Number(match[3] ?? '0');
    const seconds = Number(match[4] ?? '0');

    if (
        !Number.isFinite(days)
        || !Number.isFinite(hours)
        || !Number.isFinite(minutes)
        || !Number.isFinite(seconds)
    ) {
        return 0;
    }

    return Math.max(0, (days * 86400) + (hours * 3600) + (minutes * 60) + seconds);
}

function tryParseUrl(rawUrl: string): URL | null {
    try {
        return new URL(rawUrl);
    } catch {
        return null;
    }
}

function toCanonicalVideoId(candidate: string | null): string | null {
    if (!candidate || candidate.length < 11) {
        return null;
    }

    const canonicalCandidate = candidate.slice(0, 11);
    return /^[a-zA-Z0-9_-]{11}$/.test(canonicalCandidate) ? canonicalCandidate : null;
}
