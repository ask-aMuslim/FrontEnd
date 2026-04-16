import {
    AfterViewChecked,
    AfterViewInit,
    ChangeDetectionStrategy,
    Component,
    ElementRef,
    HostListener,
    computed,
    inject,
    input,
    output,
    signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';

export interface CourseNode {
    id: string;
    title: string;
    status: 'completed' | 'available' | 'locked' | 'in-progress';
    description?: string;
    categoryLabel?: string;
    lessons?: number;
    duration?: string;
    progress?: number;
    prerequisites?: string[];
}

interface ConnectorEdge {
    id: string;
    parentId: string;
    childId: string;
}

interface ConnectorPath {
    id: string;
    d: string;
}

@Component({
    selector: 'app-course-tree',
    standalone: true,
    imports: [CommonModule],
    changeDetection: ChangeDetectionStrategy.OnPush,
    templateUrl: './course-tree.component.html',
    styleUrls: ['./course-tree.component.scss']
})
export class CourseTreeComponent implements AfterViewInit, AfterViewChecked {

    private readonly hostElement = inject(ElementRef<HTMLElement>);
    private readonly hasDom = globalThis.document !== undefined;

    // Inputs from Academy Component
    nodes = input.required<CourseNode[]>();
    loading = input<boolean>(false);
    error = input<string | null>(null);

    // Outputs
    courseClick = output<CourseNode>();
    retryAction = output<void>();

    readonly connectorPaths = signal<readonly ConnectorPath[]>([]);
    readonly connectorCanvasWidth = signal(0);
    readonly connectorCanvasHeight = signal(0);

    layers = computed(() => {
        const nodeList = this.nodes();
        const nodeMap = new Map(nodeList.map(n => [n.id, n]));

        const depthMap = new Map<string, number>();
        const getDepth = (id: string, visited: Set<string> = new Set()): number => {
            if (depthMap.has(id)) return depthMap.get(id)!;
            if (visited.has(id)) return 0; // prevent cycle
            visited.add(id);

            const node = nodeMap.get(id);
            if (!node || !node.prerequisites || node.prerequisites.length === 0) {
                depthMap.set(id, 0);
                return 0;
            }

            let maxParentDepth = -1;
            for (const p of node.prerequisites) {
                maxParentDepth = Math.max(maxParentDepth, getDepth(p, visited));
            }
            const depth = maxParentDepth + 1;
            depthMap.set(id, depth);
            return depth;
        };

        nodeList.forEach(n => getDepth(n.id));

        const layersArr: CourseNode[][] = [];
        nodeList.forEach(n => {
            const d = depthMap.get(n.id) || 0;
            if (!layersArr[d]) layersArr[d] = [];
            layersArr[d].push(n);
        });
        return layersArr;
    });

    private readonly connectorEdges = computed<ConnectorEdge[]>(() => {
        const nodeList = this.nodes();
        const availableNodeIds = new Set(nodeList.map((node) => node.id));
        const nodeIdByNormalizedKey = new Map<string, string>();
        const nodeIdByNormalizedTitle = new Map<string, string>();

        for (const node of nodeList) {
            nodeIdByNormalizedKey.set(this.normalizeLookupKey(node.id), node.id);
            if (node.title.trim().length > 0) {
                nodeIdByNormalizedTitle.set(this.normalizeLookupKey(node.title), node.id);
            }
        }

        const seenEdgeIds = new Set<string>();
        const edges: ConnectorEdge[] = [];

        for (const childNode of nodeList) {
            for (const prerequisiteRef of childNode.prerequisites ?? []) {
                const parentId = this.resolvePrerequisiteNodeId(
                    prerequisiteRef,
                    childNode.id,
                    availableNodeIds,
                    nodeIdByNormalizedKey,
                    nodeIdByNormalizedTitle,
                );

                if (!parentId) {
                    continue;
                }

                const edgeId = `${parentId}->${childNode.id}`;
                if (seenEdgeIds.has(edgeId)) {
                    continue;
                }

                seenEdgeIds.add(edgeId);
                edges.push({
                    id: edgeId,
                    parentId,
                    childId: childNode.id,
                });
            }
        }

        return edges;
    });

    ngAfterViewInit(): void {
        this.computeConnectorPaths();
    }

    ngAfterViewChecked(): void {
        this.computeConnectorPaths();
    }

    @HostListener('window:resize')
    onWindowResize(): void {
        this.computeConnectorPaths();
    }

    retry() {
        this.retryAction.emit();
    }

    // Node Click Handler
    onNodeClick(node: CourseNode) {
        if (node.status === 'locked') {
            return;
        }
        this.courseClick.emit(node);
    }

    getProgressPercentage(node: CourseNode): number {
        if (node.status === 'completed') {
            return 100;
        }

        const normalizedProgress = Math.round(node.progress ?? 0);
        return Math.min(100, Math.max(0, normalizedProgress));
    }

    private computeConnectorPaths(): void {
        const container = this.getRenderableTreeContainer();
        if (!container) {
            this.resetConnectorState();
            return;
        }

        const containerRect = container.getBoundingClientRect();
        if (!this.hasValidContainerRect(containerRect)) {
            this.resetConnectorState();
            return;
        }

        this.updateConnectorCanvasSize(containerRect);
        const elementRects = this.collectNodeElementRects(container);
        const nextPaths = this.buildConnectorPaths(elementRects, containerRect);

        if (!this.areConnectorPathsEqual(this.connectorPaths(), nextPaths)) {
            this.connectorPaths.set(nextPaths);
        }
    }

    private getRenderableTreeContainer(): HTMLElement | null {
        if (!this.hasDom || this.loading() || !!this.error() || this.nodes().length === 0) {
            return null;
        }

        const hostElement = this.hostElement.nativeElement as HTMLElement;
        return hostElement.querySelector('.course-tree') as HTMLElement | null;
    }

    private hasValidContainerRect(containerRect: DOMRect): boolean {
        return containerRect.width > 0 && containerRect.height > 0;
    }

    private updateConnectorCanvasSize(containerRect: DOMRect): void {
        const nextCanvasWidth = Math.round(containerRect.width);
        const nextCanvasHeight = Math.round(containerRect.height);

        if (this.connectorCanvasWidth() !== nextCanvasWidth) {
            this.connectorCanvasWidth.set(nextCanvasWidth);
        }
        if (this.connectorCanvasHeight() !== nextCanvasHeight) {
            this.connectorCanvasHeight.set(nextCanvasHeight);
        }
    }

    private collectNodeElementRects(container: HTMLElement): Map<string, DOMRect> {
        const elementRects = new Map<string, DOMRect>();
        const nodeElements = container.querySelectorAll('[data-course-node-id]');
        for (const nodeElement of Array.from(nodeElements)) {
            if (!(nodeElement instanceof HTMLElement)) {
                continue;
            }

            const nodeId = nodeElement.dataset['courseNodeId'];
            if (!nodeId) {
                continue;
            }

            elementRects.set(nodeId, nodeElement.getBoundingClientRect());
        }

        return elementRects;
    }

    private buildConnectorPaths(
        elementRects: ReadonlyMap<string, DOMRect>,
        containerRect: DOMRect,
    ): ConnectorPath[] {
        const nextPaths: ConnectorPath[] = [];
        const minimumParentDrop = 22;
        const minimumChildClearance = 14;

        for (const edge of this.connectorEdges()) {
            const parentRect = elementRects.get(edge.parentId);
            const childRect = elementRects.get(edge.childId);
            if (!parentRect || !childRect) {
                continue;
            }

            const startX = this.roundCoordinate(parentRect.left + parentRect.width / 2 - containerRect.left);
            const startY = this.roundCoordinate(parentRect.bottom - containerRect.top);
            const endX = this.roundCoordinate(childRect.left + childRect.width / 2 - containerRect.left);
            const endY = this.roundCoordinate(childRect.top - containerRect.top);

            if (endY <= startY) {
                continue;
            }

            let elbowY = this.roundCoordinate(Math.min(startY + minimumParentDrop, endY - minimumChildClearance));
            if (elbowY <= startY || elbowY >= endY) {
                elbowY = this.roundCoordinate((startY + endY) / 2);
            }

            if (elbowY <= startY || elbowY >= endY) {
                nextPaths.push({
                    id: edge.id,
                    d: `M ${startX} ${startY} L ${endX} ${endY}`,
                });
                continue;
            }

            nextPaths.push({
                id: edge.id,
                d: `M ${startX} ${startY} L ${startX} ${elbowY} L ${endX} ${elbowY} L ${endX} ${endY}`,
            });
        }

        return nextPaths;
    }

    private resolvePrerequisiteNodeId(
        prerequisiteRef: string,
        childNodeId: string,
        availableNodeIds: ReadonlySet<string>,
        nodeIdByNormalizedKey: ReadonlyMap<string, string>,
        nodeIdByNormalizedTitle: ReadonlyMap<string, string>,
    ): string | null {
        const trimmedReference = prerequisiteRef.trim();
        if (trimmedReference.length === 0 || trimmedReference === childNodeId) {
            return null;
        }

        if (availableNodeIds.has(trimmedReference)) {
            return trimmedReference;
        }

        const normalizedReference = this.normalizeLookupKey(trimmedReference);
        return nodeIdByNormalizedKey.get(normalizedReference)
            ?? nodeIdByNormalizedTitle.get(normalizedReference)
            ?? null;
    }

    private normalizeLookupKey(value: string): string {
        return value.trim().toLowerCase();
    }

    private resetConnectorState(): void {
        if (this.connectorPaths().length > 0) {
            this.connectorPaths.set([]);
        }
        if (this.connectorCanvasWidth() !== 0) {
            this.connectorCanvasWidth.set(0);
        }
        if (this.connectorCanvasHeight() !== 0) {
            this.connectorCanvasHeight.set(0);
        }
    }

    private roundCoordinate(value: number): number {
        return Math.round(value * 100) / 100;
    }

    private areConnectorPathsEqual(
        currentPaths: readonly ConnectorPath[],
        nextPaths: readonly ConnectorPath[],
    ): boolean {
        if (currentPaths.length !== nextPaths.length) {
            return false;
        }

        for (let i = 0; i < currentPaths.length; i += 1) {
            const currentPath = currentPaths[i];
            const nextPath = nextPaths[i];
            if (currentPath.id !== nextPath.id || currentPath.d !== nextPath.d) {
                return false;
            }
        }

        return true;
    }
}

/*
Future implementation snapshot (commented out intentionally for future updates):

import {
    ElementRef,
    HostListener,
    PLATFORM_ID,
    AfterViewInit,
    OnDestroy,
    effect,
    inject,
    signal
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

interface FutureCourseNode extends CourseNode {
    hasUnmetPrerequisites?: boolean;
}

class FutureCourseTreeComponent implements AfterViewInit, OnDestroy {
    private readonly el = inject(ElementRef);
    private readonly platformId = inject(PLATFORM_ID);
    private readonly isBrowser = isPlatformBrowser(this.platformId);

    // SVG Line state
    svgPaths = signal<string[]>([]);

    // Resize observer to handle dynamic window resizing naturally
    private resizeObserver: ResizeObserver | null = null;

    // Previously used a barycenter-based sorting strategy inside layers()
    // and dynamic SVG connector redraw via drawLines().

    ngAfterViewInit() {
        // if (window && ResizeObserver) { ... }
        // setTimeout(() => this.drawLines(), 300);
    }

    ngOnDestroy() {
        // this.resizeObserver?.disconnect();
    }

    @HostListener('window:resize')
    onResize() {
        // this.drawLines();
    }

    drawLines() {
        // requestAnimationFrame(() => { ...compute bezier SVG paths... })
    }
}
*/
