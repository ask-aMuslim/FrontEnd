import {
    Component,
    Input,
    Output,
    EventEmitter,
    OnChanges,
    SimpleChanges,
    ChangeDetectionStrategy,
    ElementRef,
    AfterViewChecked,
    ViewChild,
} from '@angular/core';
import { NgClass } from '@angular/common';

export interface TreeCourse {
    id: string;
    title: string;
    lessons: number;
    duration: string;
    progress: number;
    status: 'available' | 'in-progress' | 'completed' | 'locked' | 'unknown';
    category: string;
    categoryLabel: string;
    prerequisiteIds?: string[];
    order?: number;
}

interface TreeNode {
    course: TreeCourse;
    tier: number;
    column: number;
}

interface Connection {
    fromId: string;
    toId: string;
}

@Component({
    selector: 'app-course-tree',
    standalone: true,
    imports: [NgClass],
    templateUrl: './course-tree.component.html',
    styleUrls: ['./course-tree.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CourseTreeComponent implements OnChanges, AfterViewChecked {
    @Input() courses: TreeCourse[] = [];
    @Output() courseClick = new EventEmitter<TreeCourse>();

    @ViewChild('svgOverlay') svgOverlay!: ElementRef<SVGElement>;

    tiers: TreeNode[][] = [];
    connections: Connection[] = [];
    svgPaths: string[] = [];

    private recalcPaths = false;

    ngOnChanges(_changes: SimpleChanges): void {
        this.buildTree();
        this.recalcPaths = true;
    }

    ngAfterViewChecked(): void {
        if (this.recalcPaths) {
            this.recalcPaths = false;
            this.computeSvgPaths();
        }
    }

    private buildTree(): void {
        if (!this.courses || this.courses.length === 0) {
            this.tiers = [];
            this.connections = [];
            return;
        }

        // Build adjacency from prerequisiteIds or fallback to order-based sequential layout
        const courseMap = new Map<string, TreeCourse>(this.courses.map(c => [c.id, c]));
        const inDegree = new Map<string, number>(this.courses.map(c => [c.id, 0]));

        // Collect connections
        this.connections = [];
        for (const course of this.courses) {
            for (const prereqId of (course.prerequisiteIds ?? [])) {
                if (courseMap.has(prereqId)) {
                    this.connections.push({ fromId: prereqId, toId: course.id });
                    inDegree.set(course.id, (inDegree.get(course.id) ?? 0) + 1);
                }
            }
        }

        // If no prerequisite relationships defined, use order-based sequential within category
        const hasPrereqData = this.connections.length > 0;
        if (!hasPrereqData) {
            this.buildOrderBasedTree();
            return;
        }

        // Kahn's algorithm for topological level assignment
        const tierAssignment = new Map<string, number>();
        const queue: string[] = [];

        for (const [id, deg] of inDegree) {
            if (deg === 0) {
                queue.push(id);
                tierAssignment.set(id, 0);
            }
        }

        while (queue.length > 0) {
            const current = queue.shift()!;
            const currentTier = tierAssignment.get(current)!;
            for (const conn of this.connections) {
                if (conn.fromId === current) {
                    const nextTier = currentTier + 1;
                    const existingTier = tierAssignment.get(conn.toId);
                    if (existingTier === undefined || existingTier < nextTier) {
                        tierAssignment.set(conn.toId, nextTier);
                    }
                    queue.push(conn.toId);
                }
            }
        }

        // Group into tiers
        const tiersMap = new Map<number, TreeCourse[]>();
        for (const course of this.courses) {
            const tier = tierAssignment.get(course.id) ?? 0;
            if (!tiersMap.has(tier)) tiersMap.set(tier, []);
            tiersMap.get(tier)!.push(course);
        }

        const maxTier = Math.max(...tiersMap.keys());
        this.tiers = [];
        for (let t = 0; t <= maxTier; t++) {
            const tierCourses = tiersMap.get(t) ?? [];
            this.tiers.push(
                tierCourses.map((c, col) => ({ course: c, tier: t, column: col }))
            );
        }
    }

    private buildOrderBasedTree(): void {
        // Without prerequisites: group by category, sort by order, display in separate columns per category
        const categories = ['main-believes', 'models-stories', 'social-topics'];
        const categoryTiers: TreeNode[][] = [];

        // Find max column count
        let maxRows = 0;
        const groupedByCat = new Map<string, TreeCourse[]>();
        for (const cat of categories) {
            const catCourses = this.courses
                .filter(c => c.category === cat)
                .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
            groupedByCat.set(cat, catCourses);
            maxRows = Math.max(maxRows, catCourses.length);
        }

        // Build vertical tiers (one tier per row in the category)
        for (let row = 0; row < maxRows; row++) {
            const tier: TreeNode[] = [];
            let col = 0;
            for (const cat of categories) {
                const catCourses = groupedByCat.get(cat) ?? [];
                if (catCourses[row]) {
                    tier.push({ course: catCourses[row], tier: row, column: col });
                }
                col++;
            }
            categoryTiers.push(tier);
        }

        this.tiers = categoryTiers;

        // Build sequential connections within each category
        this.connections = [];
        for (const cat of categories) {
            const catCourses = groupedByCat.get(cat) ?? [];
            for (let i = 1; i < catCourses.length; i++) {
                this.connections.push({ fromId: catCourses[i - 1].id, toId: catCourses[i].id });
            }
        }
    }

    private computeSvgPaths(): void {
        if (!this.svgOverlay) return;
        this.svgPaths = [];

        for (const conn of this.connections) {
            const fromEl = document.getElementById(`course-node-${conn.fromId}`);
            const toEl = document.getElementById(`course-node-${conn.toId}`);
            const svgEl = this.svgOverlay.nativeElement;

            if (!fromEl || !toEl || !svgEl) continue;

            const svgRect = svgEl.getBoundingClientRect();
            const fromRect = fromEl.getBoundingClientRect();
            const toRect = toEl.getBoundingClientRect();

            const x1 = fromRect.left + fromRect.width / 2 - svgRect.left;
            const y1 = fromRect.bottom - svgRect.top;
            const x2 = toRect.left + toRect.width / 2 - svgRect.left;
            const y2 = toRect.top - svgRect.top;

            const cy = (y1 + y2) / 2;
            this.svgPaths.push(`M ${x1} ${y1} C ${x1} ${cy}, ${x2} ${cy}, ${x2} ${y2}`);
        }
    }

    getAllCourses(): TreeCourse[] {
        return this.tiers.flat().map(n => n.course);
    }

    onCourseClick(course: TreeCourse): void {
        if (course.status !== 'locked') {
            this.courseClick.emit(course);
        }
    }

    getConnectionStatus(conn: Connection): string {
        const fromCourse = this.courses.find(c => c.id === conn.fromId);
        if (fromCourse?.status === 'completed') return 'completed';
        if (fromCourse?.status === 'in-progress') return 'in-progress';
        return 'locked';
    }
}
