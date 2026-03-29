import { Component, ChangeDetectionStrategy, input, output, computed, ElementRef, inject, signal, HostListener, AfterViewInit, OnDestroy, effect, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';

export interface CourseNode {
    id: string;
    title: string;
    status: 'completed' | 'available' | 'locked' | 'in-progress';
    hasUnmetPrerequisites?: boolean;
    description?: string;
    prerequisites?: string[];
}

@Component({
    selector: 'app-course-tree',
    standalone: true,
    imports: [CommonModule],
    changeDetection: ChangeDetectionStrategy.OnPush,
    templateUrl: './course-tree.component.html',
    styleUrls: ['./course-tree.component.scss']
})
export class CourseTreeComponent implements AfterViewInit, OnDestroy {
    private readonly el = inject(ElementRef);
    private readonly platformId = inject(PLATFORM_ID);
    private readonly isBrowser = isPlatformBrowser(this.platformId);

    // Inputs from Academy Component
    nodes = input.required<CourseNode[]>();
    loading = input<boolean>(false);
    error = input<string | null>(null);

    // Outputs
    courseClick = output<CourseNode>();
    retryAction = output<void>();

    // SVG Line state
    svgPaths = signal<string[]>([]);

    // Resize observer to handle dynamic window resizing naturally
    private resizeObserver: ResizeObserver | null = null;

    constructor() {
        // Automatically redraw lines whenever the tree layers change
        effect(() => {
            const _ = this.layers(); // track layers
            if (!this.isBrowser) {
                return;
            }
            // Small delay to ensure DOM is rendered after signal change
            globalThis.setTimeout(() => this.drawLines(), 100);
        });
    }

    layers = computed(() => {
        const nodeList = this.nodes();
        const nodeMap = new Map(nodeList.map(n => [n.id, n]));

        const depthMap = new Map<string, number>();
        const getDepth = (id: string, visited: Set<string> = new Set()): number => {
            if (depthMap.has(id)) return depthMap.get(id)!;
            if (visited.has(id)) return 0; // prevent cycle
            visited.add(id);

            const node = nodeMap.get(id);
            if (!node?.prerequisites || node.prerequisites.length === 0) {
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

        const unsortedLayers: CourseNode[][] = [];
        nodeList.forEach(n => {
            const d = depthMap.get(n.id) || 0;
            if (!unsortedLayers[d]) unsortedLayers[d] = [];
            unsortedLayers[d].push(n);
        });

        // Optimization: Sort nodes within each layer to place children near parents
        const sortedLayers: CourseNode[][] = [];
        if (unsortedLayers.length > 0) {
            // Layer 0 is sorted by original list order or ID for stability
            sortedLayers[0] = [...unsortedLayers[0]].sort((a, b) => a.id.localeCompare(b.id));

            for (let d = 1; d < unsortedLayers.length; d++) {
                const prevLayer = sortedLayers[d - 1];
                const prevLayerMap = new Map(prevLayer.map((n, i) => [n.id, i]));

                const currentLayer = [...unsortedLayers[d]].sort((a, b) => {
                    const getBarycenter = (node: CourseNode) => {
                        const parents = node.prerequisites || [];
                        const parentIndices = parents
                            .map(pId => prevLayerMap.get(pId))
                            .filter((idx): idx is number => idx !== undefined);

                        if (parentIndices.length === 0) return 999; // Roots or skips move to right
                        return parentIndices.reduce((sum, idx) => sum + idx, 0) / parentIndices.length;
                    };

                    const scoreA = getBarycenter(a);
                    const scoreB = getBarycenter(b);

                    if (scoreA !== scoreB) return scoreA - scoreB;
                    return a.id.localeCompare(b.id);
                });

                sortedLayers[d] = currentLayer;
            }
        }

        return sortedLayers;
    });

    ngAfterViewInit() {
        if (!this.isBrowser) {
            return;
        }

        if (globalThis.window !== undefined && 'ResizeObserver' in globalThis.window) {
            this.resizeObserver = new ResizeObserver(() => {
                this.drawLines();
            });
            this.resizeObserver.observe(this.el.nativeElement);
        }
        // Initial draw after view initialization
        globalThis.setTimeout(() => this.drawLines(), 300);
    }

    ngOnDestroy() {
        if (this.resizeObserver) {
            this.resizeObserver.disconnect();
        }
    }

    @HostListener('window:resize')
    onResize() {
        if (!this.isBrowser) {
            return;
        }
        this.drawLines();
    }

    drawLines() {
        if (!this.isBrowser) {
            return;
        }

        if (!this.el) return;
        const container = this.el.nativeElement.querySelector('.tree-container');
        if (!container) return;

        globalThis.requestAnimationFrame(() => {
            const containerRect = container.getBoundingClientRect();
            const paths: string[] = [];

            // Use the native element querying isolated to this component's hierarchy
            const nodeList = this.nodes();
            for (const node of nodeList) {
                if (!node.prerequisites || node.prerequisites.length === 0) continue;

                const targetEl = container.querySelector(`#course-node-${node.id}`);
                if (!targetEl) continue;

                const targetRect = targetEl.getBoundingClientRect();
                // child target center top
                const targetX = targetRect.left - containerRect.left + (targetRect.width / 2);
                const targetY = targetRect.top - containerRect.top;

                for (const parentId of node.prerequisites) {
                    const parentEl = container.querySelector(`#course-node-${parentId}`);
                    if (!parentEl) continue;

                    const parentRect = parentEl.getBoundingClientRect();
                    // parent source center bottom
                    const parentX = parentRect.left - containerRect.left + (parentRect.width / 2);
                    const parentY = parentRect.bottom - containerRect.top;

                    // Construct a sleek smooth bezier curve (flow chart style) connecting parent to child
                    const verticalSpace = Math.abs(targetY - parentY);
                    const controlY = parentY + (verticalSpace * 0.5);

                    const d = `M ${parentX} ${parentY} C ${parentX} ${controlY}, ${targetX} ${controlY}, ${targetX} ${targetY}`;
                    paths.push(d);
                }
            }

            this.svgPaths.set(paths);
        });
    }

    retry() {
        this.retryAction.emit();
    }

    // Node Click Handler
    onNodeClick(node: CourseNode) {
        this.courseClick.emit(node);
    }
}
