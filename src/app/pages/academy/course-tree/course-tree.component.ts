import { Component, ChangeDetectionStrategy, input, output, OnInit, computed } from '@angular/core';
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
