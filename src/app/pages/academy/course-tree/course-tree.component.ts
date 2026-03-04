import { Component, ChangeDetectionStrategy, input, output, computed, ElementRef, inject, signal, HostListener, AfterViewInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface CourseNode {
    id: string;
    title: string;
    status: 'completed' | 'available' | 'locked' | 'in-progress';
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
    private el = inject(ElementRef);

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

        // Wait for rendering to complete after new layers are mapped to redraw lines
        setTimeout(() => this.drawLines(), 50);

        return layersArr;
    });

    ngAfterViewInit() {
        if (typeof window !== 'undefined' && 'ResizeObserver' in window) {
            this.resizeObserver = new ResizeObserver(() => {
                this.drawLines();
            });
            this.resizeObserver.observe(this.el.nativeElement);
        }
    }

    ngOnDestroy() {
        if (this.resizeObserver) {
            this.resizeObserver.disconnect();
        }
    }

    @HostListener('window:resize')
    onResize() {
        this.drawLines();
    }

    drawLines() {
        if (!this.el) return;
        const container = this.el.nativeElement.querySelector('.tree-container');
        if (!container) return;

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
}
