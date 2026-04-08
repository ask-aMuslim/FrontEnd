import { Component, ChangeDetectionStrategy, input, output, computed } from '@angular/core';
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
export class CourseTreeComponent {

    // Inputs from Academy Component
    nodes = input.required<CourseNode[]>();
    loading = input<boolean>(false);
    error = input<string | null>(null);

    // Outputs
    courseClick = output<CourseNode>();
    retryAction = output<void>();

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
