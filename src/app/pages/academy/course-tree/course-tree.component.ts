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
  completedLessonsCount?: number;
  totalLessonsCount?: number;
  completedQuizzesCount?: number;
  totalQuizzesCount?: number;
  duration?: string;
  progress?: number;
  prerequisites?: string[];
  prerequisiteIds?: string[];
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

  readonly groupedLayers = computed<readonly CourseNode[][][]>(() => {
    const nodeList = this.nodes();
    if (nodeList.length === 0) {
      return [];
    }

    const nodeById = new Map(nodeList.map((node) => [node.id, node]));
    const nodeOrderById = new Map<string, number>();
    nodeList.forEach((node, index) => nodeOrderById.set(node.id, index));

    const adjacencyById = new Map<string, Set<string>>();
    for (const node of nodeList) {
      adjacencyById.set(node.id, new Set<string>());
    }

    for (const edge of this.connectorEdges()) {
      adjacencyById.get(edge.parentId)?.add(edge.childId);
      adjacencyById.get(edge.childId)?.add(edge.parentId);
    }

    const visited = new Set<string>();
    const linkedComponents: CourseNode[][] = [];
    const standaloneNodes: CourseNode[] = [];

    for (const node of nodeList) {
      if (visited.has(node.id)) {
        continue;
      }

      const componentNodes = this.collectComponentNodes(
        node.id,
        visited,
        adjacencyById,
        nodeById,
      );

      if (componentNodes.length === 0) {
        continue;
      }

      if (this.componentHasEdges(componentNodes, adjacencyById)) {
        linkedComponents.push(componentNodes);
        continue;
      }

      standaloneNodes.push(...componentNodes);
    }

    linkedComponents.sort((leftNodes, rightNodes) =>
      this.getComponentMinOrder(leftNodes, nodeOrderById)
      - this.getComponentMinOrder(rightNodes, nodeOrderById),
    );

    const groupedLayers: CourseNode[][][] = linkedComponents.map((componentNodes) =>
      this.buildLayersForComponent(componentNodes, nodeOrderById),
    );

    if (standaloneNodes.length > 0) {
      standaloneNodes.sort((leftNode, rightNode) =>
        this.getNodeOrder(leftNode.id, nodeOrderById)
        - this.getNodeOrder(rightNode.id, nodeOrderById),
      );
      groupedLayers.push(this.buildLayersForComponent(standaloneNodes, nodeOrderById));
    }

    return groupedLayers;
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
      for (const prerequisiteRef of this.getNodePrerequisites(childNode)) {
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

  private getNodePrerequisites(node: CourseNode): readonly string[] {
    return node.prerequisiteIds ?? node.prerequisites ?? [];
  }

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

  private collectComponentNodes(
    startNodeId: string,
    visited: Set<string>,
    adjacencyById: ReadonlyMap<string, ReadonlySet<string>>,
    nodeById: ReadonlyMap<string, CourseNode>,
  ): CourseNode[] {
    const componentNodes: CourseNode[] = [];
    const stack = [startNodeId];

    while (stack.length > 0) {
      const currentNodeId = stack.pop();
      if (!currentNodeId || visited.has(currentNodeId)) {
        continue;
      }

      visited.add(currentNodeId);
      const currentNode = nodeById.get(currentNodeId);
      if (currentNode) {
        componentNodes.push(currentNode);
      }

      const neighbors = adjacencyById.get(currentNodeId);
      if (!neighbors) {
        continue;
      }

      for (const neighborId of neighbors) {
        if (!visited.has(neighborId)) {
          stack.push(neighborId);
        }
      }
    }

    return componentNodes;
  }

  private componentHasEdges(
    componentNodes: readonly CourseNode[],
    adjacencyById: ReadonlyMap<string, ReadonlySet<string>>,
  ): boolean {
    for (const node of componentNodes) {
      const neighbors = adjacencyById.get(node.id);
      if (neighbors && neighbors.size > 0) {
        return true;
      }
    }

    return false;
  }

  private buildLayersForComponent(
    componentNodes: readonly CourseNode[],
    nodeOrderById: ReadonlyMap<string, number>,
  ): CourseNode[][] {
    const componentNodeIds = new Set(componentNodes.map((node) => node.id));
    const parentIdsByChildId = new Map<string, string[]>();

    for (const node of componentNodes) {
      parentIdsByChildId.set(node.id, []);
    }

    for (const edge of this.connectorEdges()) {
      if (!componentNodeIds.has(edge.parentId) || !componentNodeIds.has(edge.childId)) {
        continue;
      }

      const parentIds = parentIdsByChildId.get(edge.childId);
      if (!parentIds) {
        continue;
      }

      parentIds.push(edge.parentId);
    }

    const depthByNodeId = new Map<string, number>();
    const getDepth = (nodeId: string, path: ReadonlySet<string> = new Set<string>()): number => {
      const existingDepth = depthByNodeId.get(nodeId);
      if (typeof existingDepth === 'number') {
        return existingDepth;
      }

      if (path.has(nodeId)) {
        return 0;
      }

      const nextPath = new Set(path);
      nextPath.add(nodeId);

      const parentIds = parentIdsByChildId.get(nodeId) ?? [];
      if (parentIds.length === 0) {
        depthByNodeId.set(nodeId, 0);
        return 0;
      }

      let maxParentDepth = 0;
      for (const parentId of parentIds) {
        maxParentDepth = Math.max(maxParentDepth, getDepth(parentId, nextPath));
      }

      const nodeDepth = maxParentDepth + 1;
      depthByNodeId.set(nodeId, nodeDepth);
      return nodeDepth;
    };

    for (const node of componentNodes) {
      getDepth(node.id);
    }

    const layers: CourseNode[][] = [];
    for (const node of componentNodes) {
      const depth = depthByNodeId.get(node.id) ?? 0;
      if (!layers[depth]) {
        layers[depth] = [];
      }
      layers[depth].push(node);
    }

    for (const layer of layers) {
      layer.sort((leftNode, rightNode) =>
        this.getNodeOrder(leftNode.id, nodeOrderById)
        - this.getNodeOrder(rightNode.id, nodeOrderById),
      );
    }

    return layers;
  }

  private getComponentMinOrder(
    nodes: readonly CourseNode[],
    nodeOrderById: ReadonlyMap<string, number>,
  ): number {
    let minOrder = Number.POSITIVE_INFINITY;
    for (const node of nodes) {
      minOrder = Math.min(minOrder, this.getNodeOrder(node.id, nodeOrderById));
    }

    return Number.isFinite(minOrder) ? minOrder : Number.MAX_SAFE_INTEGER;
  }

  private getNodeOrder(
    nodeId: string,
    nodeOrderById: ReadonlyMap<string, number>,
  ): number {
    const nodeOrder = nodeOrderById.get(nodeId);
    return typeof nodeOrder === 'number' ? nodeOrder : Number.MAX_SAFE_INTEGER;
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
