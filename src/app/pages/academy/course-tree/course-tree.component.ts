import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostListener,
  computed,
  inject,
  input,
  output,
  signal,
  PLATFORM_ID,
  afterNextRender,
  afterEveryRender,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule, DOCUMENT, isPlatformBrowser } from '@angular/common';

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

interface EdgeGeometry {
  edge: ConnectorEdge;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
}

@Component({
  selector: 'app-course-tree',
  standalone: true,
  imports: [CommonModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './course-tree.component.html',
  styleUrls: ['./course-tree.component.scss']
})
export class CourseTreeComponent {

  private readonly hostElement = inject(ElementRef<HTMLElement>);
  private readonly document = inject(DOCUMENT);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);
  private lastCenteredScrollLayoutKey = '';

  constructor() {
    afterNextRender(() => {
      this.computeConnectorPaths();
    });

    afterEveryRender(() => {
      this.computeConnectorPaths();
    });
  }


  // Inputs from Academy Component
  nodes = input.required<CourseNode[]>();
  loading = input<boolean>(false);
  error = input<string | null>(null);

  // Outputs
  courseClick = output<CourseNode>();
  retryAction = output<void>();

  readonly hasNoPrerequisites = computed<boolean>(() => {
    const nodeList = this.nodes();
    if (nodeList.length === 0) {
      return false;
    }
    return nodeList.every(node => {
      const prereqs = node.prerequisiteIds ?? node.prerequisites ?? [];
      return prereqs.length === 0;
    });
  });

  readonly connectorPaths = signal<readonly ConnectorPath[]>([]);
  readonly connectorCanvasWidth = signal(0);
  readonly connectorCanvasHeight = signal(0);
  private readonly viewportWidth = signal<number>(this.isBrowser ? window.innerWidth : 1200);

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

  @HostListener('window:resize')
  onWindowResize(): void {
    if (this.isBrowser) {
      this.viewportWidth.set(window.innerWidth);
      this.computeConnectorPaths();
    }
  }


  retry() {
    this.retryAction.emit();
  }

  // Node Click Handler
  onNodeClick(node: CourseNode) {
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

    this.centerTreeScrollbarIfNeeded();
  }

  private getRenderableTreeContainer(): HTMLElement | null {
    if (!this.isBrowser || this.loading() || !!this.error() || this.nodes().length === 0 || this.hasNoPrerequisites()) {
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

  private buildMobileConnectorPaths(
    elementRects: ReadonlyMap<string, DOMRect>,
    containerRect: DOMRect,
  ): ConnectorPath[] {
    const nextPaths: ConnectorPath[] = [];
    const edgeGeometries: {
      edge: ConnectorEdge;
      startX: number;
      startY: number;
      endX: number;
      endY: number;
      routeSide: 'left' | 'right';
    }[] = [];

    // Collect all parents in the entire tree, sorted by their DOM/visual position (top-to-bottom, left-to-right)
    const allParentIds = Array.from(new Set(this.connectorEdges().map(e => e.parentId)));
    const sortedParents = allParentIds.map(parentId => {
      const rect = elementRects.get(parentId);
      const startY = rect ? rect.top : 0;
      const startX = rect ? rect.left : 0;
      return { parentId, startY, startX };
    })
    .sort((a, b) => {
      if (Math.abs(a.startY - b.startY) > 5) {
        return a.startY - b.startY;
      }
      return a.startX - b.startX;
    })
    .map(p => p.parentId);

    const containerCenterX = containerRect.width / 2;

    for (const edge of this.connectorEdges()) {
      const parentRect = elementRects.get(edge.parentId);
      const childRect = elementRects.get(edge.childId);
      if (!parentRect || !childRect) {
        continue;
      }

      // Determine which side to route: left or right
      // If there are exactly two parents, the first parent goes to the left and the second parent goes to the right
      let routeSide: 'left' | 'right';
      if (sortedParents.length === 2) {
        routeSide = edge.parentId === sortedParents[0] ? 'left' : 'right';
      } else {
        const childCenterX = childRect.left + childRect.width / 2 - containerRect.left;
        routeSide = childCenterX < containerCenterX ? 'left' : 'right';
      }

      let startX = 0;
      let startY = this.roundCoordinate(parentRect.top + parentRect.height / 2 - containerRect.top);
      let endX = 0;
      let endY = this.roundCoordinate(childRect.top + childRect.height / 2 - containerRect.top);

      if (routeSide === 'left') {
        startX = this.roundCoordinate(parentRect.left - containerRect.left);
        endX = this.roundCoordinate(childRect.left - containerRect.left);
      } else {
        startX = this.roundCoordinate(parentRect.right - containerRect.left);
        endX = this.roundCoordinate(childRect.right - containerRect.left);
      }

      edgeGeometries.push({
        edge,
        startX,
        startY,
        endX,
        endY,
        routeSide,
      });
    }

    // Group by side to assign lane indexes and avoid line overlaps
    const leftEdges = edgeGeometries.filter(g => g.routeSide === 'left');
    const rightEdges = edgeGeometries.filter(g => g.routeSide === 'right');

    // For Left Side: group lanes by parent to follow the same lane
    // Sort parents by startY in ascending order (top to bottom)
    const leftParents = Array.from(new Set(leftEdges.map(g => g.edge.parentId)))
      .map(parentId => {
        const firstGeom = leftEdges.find(g => g.edge.parentId === parentId)!;
        return { parentId, startY: firstGeom.startY };
      })
      .sort((a, b) => a.startY - b.startY)
      .map(p => p.parentId);

    const leftParentMinVals = new Map<string, number>();
    for (const parentId of leftParents) {
      const parentGeometries = leftEdges.filter(g => g.edge.parentId === parentId);
      const minVal = Math.min(...parentGeometries.map(g => Math.min(g.startX, g.endX)));
      leftParentMinVals.set(parentId, minVal);
    }

    leftEdges.forEach((geometry) => {
      const startX = geometry.startX;
      const startY = geometry.startY;
      const endX = geometry.endX;
      const endY = geometry.endY;

      const parentId = geometry.edge.parentId;
      // High parents (smaller index in leftParents) get outer lane (larger offset),
      // low parents (larger index in leftParents) get inner lane (smaller offset).
      const parentIndex = leftParents.length - 1 - leftParents.indexOf(parentId);
      const minVal = leftParentMinVals.get(parentId)!;

      // Left highway goes further left. Offset each parent lane by 10px
      const highwayX = this.roundCoordinate(minVal - 24 - (parentIndex * 10));

      nextPaths.push({
        id: geometry.edge.id,
        d: `M ${startX} ${startY} H ${highwayX} V ${endY} H ${endX}`,
      });
    });

    // For Right Side: group lanes by parent to follow the same lane
    // Sort parents by startY in ascending order (top to bottom)
    const rightParents = Array.from(new Set(rightEdges.map(g => g.edge.parentId)))
      .map(parentId => {
        const firstGeom = rightEdges.find(g => g.edge.parentId === parentId)!;
        return { parentId, startY: firstGeom.startY };
      })
      .sort((a, b) => a.startY - b.startY)
      .map(p => p.parentId);

    const rightParentMaxVals = new Map<string, number>();
    for (const parentId of rightParents) {
      const parentGeometries = rightEdges.filter(g => g.edge.parentId === parentId);
      const maxVal = Math.max(...parentGeometries.map(g => Math.max(g.startX, g.endX)));
      rightParentMaxVals.set(parentId, maxVal);
    }

    rightEdges.forEach((geometry) => {
      const startX = geometry.startX;
      const startY = geometry.startY;
      const endX = geometry.endX;
      const endY = geometry.endY;

      const parentId = geometry.edge.parentId;
      // High parents (smaller index in rightParents) get outer lane (larger offset),
      // low parents (larger index in rightParents) get inner lane (smaller offset).
      const parentIndex = rightParents.length - 1 - rightParents.indexOf(parentId);
      const maxVal = rightParentMaxVals.get(parentId)!;

      // Right highway goes further right. Offset each parent lane by 10px
      const highwayX = this.roundCoordinate(maxVal + 24 + (parentIndex * 10));

      nextPaths.push({
        id: geometry.edge.id,
        d: `M ${startX} ${startY} H ${highwayX} V ${endY} H ${endX}`,
      });
    });

    return nextPaths;
  }

  private buildConnectorPaths(
    elementRects: ReadonlyMap<string, DOMRect>,
    containerRect: DOMRect,
  ): ConnectorPath[] {
    // Mobile side-routing is strictly for narrow mobile devices (<= 576px).
    // Larger screens (tablets >= 577px and desktops) use bottom-to-top elbow connector paths.
    const isMobile = this.isBrowser && window.innerWidth <= 576;
    if (isMobile) {
      return this.buildMobileConnectorPaths(elementRects, containerRect);
    }

    const nextPaths: ConnectorPath[] = [];
    const minimumParentDrop = 26;
    const minimumChildClearance = 20;
    const laneGap = 16;
    const incomingLaneInset = 32;

    const edgeGeometries: EdgeGeometry[] = [];
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

      edgeGeometries.push({
        edge,
        startX,
        startY,
        endX,
        endY,
      });
    }

    const incomingByChild = new Map<string, EdgeGeometry[]>();
    for (const geometry of edgeGeometries) {
      const list = incomingByChild.get(geometry.edge.childId);
      if (list) {
        list.push(geometry);
      } else {
        incomingByChild.set(geometry.edge.childId, [geometry]);
      }
    }

    const targetEndXByEdgeId = new Map<string, number>();
    for (const incomingEdges of incomingByChild.values()) {
      incomingEdges.sort((leftEdge, rightEdge) => leftEdge.startX - rightEdge.startX);

      const edgeCount = incomingEdges.length;
      if (edgeCount === 1) {
        targetEndXByEdgeId.set(incomingEdges[0].edge.id, incomingEdges[0].endX);
      } else {
        const byCenterDistance = [...incomingEdges].sort(
          (leftEdge, rightEdge) =>
            Math.abs(leftEdge.startX - leftEdge.endX) - Math.abs(rightEdge.startX - rightEdge.endX),
        );

        const centerEntryEdge = byCenterDistance[0];
        targetEndXByEdgeId.set(centerEntryEdge.edge.id, centerEntryEdge.endX);

        const sideEdges = incomingEdges.filter((edge) => edge.edge.id !== centerEntryEdge.edge.id);
        const leftSideEdges = sideEdges
          .filter((edge) => edge.startX < centerEntryEdge.endX)
          .sort((leftEdge, rightEdge) => Math.abs(leftEdge.startX - leftEdge.endX) - Math.abs(rightEdge.startX - rightEdge.endX));
        const rightSideEdges = sideEdges
          .filter((edge) => edge.startX >= centerEntryEdge.endX)
          .sort((leftEdge, rightEdge) => Math.abs(leftEdge.startX - leftEdge.endX) - Math.abs(rightEdge.startX - rightEdge.endX));

        for (let index = 0; index < leftSideEdges.length; index += 1) {
          const edge = leftSideEdges[index];
          targetEndXByEdgeId.set(
            edge.edge.id,
            this.roundCoordinate(centerEntryEdge.endX - Math.min(incomingLaneInset, laneGap * (index + 1))),
          );
        }

        for (let index = 0; index < rightSideEdges.length; index += 1) {
          const edge = rightSideEdges[index];
          targetEndXByEdgeId.set(
            edge.edge.id,
            this.roundCoordinate(centerEntryEdge.endX + Math.min(incomingLaneInset, laneGap * (index + 1))),
          );
        }
      }
    }

    const outgoingByParent = new Map<string, EdgeGeometry[]>();
    for (const geometry of edgeGeometries) {
      const list = outgoingByParent.get(geometry.edge.parentId);
      if (list) {
        list.push(geometry);
      } else {
        outgoingByParent.set(geometry.edge.parentId, [geometry]);
      }
    }

    const parentGroups = Array.from(outgoingByParent.values());
    parentGroups.sort((a, b) => a[0].startX - b[0].startX);

    const parentGroupsCount = parentGroups.length;
    for (let groupIndex = 0; groupIndex < parentGroupsCount; groupIndex += 1) {
      const outgoingEdges = parentGroups[groupIndex];
      const firstEdge = outgoingEdges[0];
      const startX = firstEdge.startX;
      const startY = firstEdge.startY;

      const allSameLevel = outgoingEdges.every(
        (g) => Math.abs(g.endY - firstEdge.endY) < 1.0
      );

      // Alternating Y-track offset (padding) sorted right-to-left.
      // Rightmost parents get higher split bars (smaller Y) and leftmost get lower split bars (larger Y)
      // to mathematically prevent leftmost vertical trunk lines from crossing rightmost horizontal split lines.
      const parentOffset = parentGroupsCount > 1 
        ? ((parentGroupsCount - 1 - groupIndex) % 3 - 1) * 16 
        : 0;

      if (outgoingEdges.length > 1 && allSameLevel) {
        const sharedEndY = firstEdge.endY;
        let elbowY = startY + (sharedEndY - startY) * 0.5 + parentOffset;
        elbowY = this.clamp(elbowY, startY + 6, sharedEndY - 6);
        elbowY = this.roundCoordinate(elbowY);

        for (const geometry of outgoingEdges) {
          const targetEndX = targetEndXByEdgeId.get(geometry.edge.id) ?? geometry.endX;
          nextPaths.push({
            id: geometry.edge.id,
            d: `M ${startX} ${startY} L ${startX} ${elbowY} L ${targetEndX} ${elbowY} L ${targetEndX} ${sharedEndY}`,
          });
        }
      } else {
        const minEndY = Math.min(...outgoingEdges.map(g => g.endY));
        let splitterY = startY + (minEndY - startY) * 0.5 + parentOffset;
        splitterY = this.clamp(splitterY, startY + 6, minEndY - 6);
        splitterY = this.roundCoordinate(splitterY);

        for (const geometry of outgoingEdges) {
          const endY = geometry.endY;
          const targetEndX = targetEndXByEdgeId.get(geometry.edge.id) ?? geometry.endX;

          // Check if the straight drop at targetEndX is blocked by any card in the middle
          let blockerRect: DOMRect | null = null;
          for (const [nodeId, rect] of elementRects.entries()) {
            if (nodeId === geometry.edge.parentId || nodeId === geometry.edge.childId) {
              continue;
            }
            const left = rect.left - containerRect.left;
            const right = rect.right - containerRect.left;
            const top = rect.top - containerRect.top;
            const bottom = rect.bottom - containerRect.top;

            // Blocker matches if it overlaps horizontally with targetEndX and sits between splitterY and endY
            const overlapsHorizontally = targetEndX >= left - 8 && targetEndX <= right + 8;
            const overlapsVertically = bottom >= splitterY && top <= endY;

            if (overlapsHorizontally && overlapsVertically) {
              blockerRect = rect;
              break;
            }
          }

          if (blockerRect) {
            const blockerLeft = blockerRect.left - containerRect.left;
            const blockerRight = blockerRect.right - containerRect.left;
            const blockerBottom = blockerRect.bottom - containerRect.top;
            const blockerTop = blockerRect.top - containerRect.top;

            // Find neighboring cards in the same row (vertical overlap) to route the line safely in the middle of the gap
            let leftNeighborRect: DOMRect | null = null;
            let rightNeighborRect: DOMRect | null = null;

            for (const [nodeId, rect] of elementRects.entries()) {
              if (nodeId === geometry.edge.parentId || nodeId === geometry.edge.childId || rect === blockerRect) {
                continue;
              }
              const rectTop = rect.top - containerRect.top;
              const rectBottom = rect.bottom - containerRect.top;

              const sameRow = rectBottom >= blockerTop && rectTop <= blockerBottom;
              if (sameRow) {
                if (rect.right <= blockerRect.left) {
                  if (!leftNeighborRect || rect.right > leftNeighborRect.right) {
                    leftNeighborRect = rect;
                  }
                } else if (rect.left >= blockerRect.right) {
                  if (!rightNeighborRect || rect.left < rightNeighborRect.left) {
                    rightNeighborRect = rect;
                  }
                }
              }
            }

            // Calculate safe gap X coordinates
            let gapLeftX = 0;
            if (leftNeighborRect) {
              const neighborRight = leftNeighborRect.right - containerRect.left;
              gapLeftX = this.roundCoordinate(neighborRight + (blockerLeft - neighborRight) / 2);
            } else {
              gapLeftX = this.roundCoordinate(blockerLeft - 24);
            }

            let gapRightX = 0;
            if (rightNeighborRect) {
              const neighborLeft = rightNeighborRect.left - containerRect.left;
              gapRightX = this.roundCoordinate(blockerRight + (neighborLeft - blockerRight) / 2);
            } else {
              gapRightX = this.roundCoordinate(blockerRight + 24);
            }

            // Choose the outside gap to keep center gaps clear of vertical blocker bypasses
            const containerCenterX = containerRect.width / 2;
            const blockerCenterX = blockerRect.left + blockerRect.width / 2 - containerRect.left;
            const gapX = blockerCenterX < containerCenterX ? gapLeftX : gapRightX;
            let belowBlockerY = blockerBottom + 20;
            belowBlockerY = this.clamp(belowBlockerY, blockerBottom + 6, endY - 6);
            belowBlockerY = this.roundCoordinate(belowBlockerY);

            nextPaths.push({
              id: geometry.edge.id,
              d: `M ${startX} ${startY} L ${startX} ${splitterY} L ${gapX} ${splitterY} L ${gapX} ${belowBlockerY} L ${targetEndX} ${belowBlockerY} L ${targetEndX} ${endY}`,
            });
          } else {
            // Standard elbow path (no blocking card)
            if (splitterY <= startY || splitterY >= endY) {
              nextPaths.push({
                id: geometry.edge.id,
                d: `M ${startX} ${startY} L ${targetEndX} ${endY}`,
              });
            } else {
              nextPaths.push({
                id: geometry.edge.id,
                d: `M ${startX} ${startY} L ${startX} ${splitterY} L ${targetEndX} ${splitterY} L ${targetEndX} ${endY}`,
              });
            }
          }
        }
      }
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

    if (layers.length > 0) {
      layers[0].sort((leftNode, rightNode) =>
        this.getNodeOrder(leftNode.id, nodeOrderById)
        - this.getNodeOrder(rightNode.id, nodeOrderById),
      );
    }

    for (let d = 1; d < layers.length; d++) {
      const prevLayer = layers[d - 1];
      const parentIndexMap = new Map<string, number>();
      prevLayer.forEach((node, index) => {
        parentIndexMap.set(node.id, index);
      });

      // 1. Sort using standard barycenter first to get a clean baseline order
      layers[d].sort((leftNode, rightNode) => {
        const getBarycenter = (node: CourseNode): number => {
          const parentIds = parentIdsByChildId.get(node.id) ?? [];
          const indices = parentIds
            .map(id => parentIndexMap.get(id))
            .filter((idx): idx is number => idx !== undefined);

          if (indices.length > 0) {
            return indices.reduce((a, b) => a + b, 0) / indices.length;
          }
          return this.getNodeOrder(node.id, nodeOrderById) / 10000;
        };

        const leftBary = getBarycenter(leftNode);
        const rightBary = getBarycenter(rightNode);

        if (Math.abs(leftBary - rightBary) > 0.0001) {
          return leftBary - rightBary;
        }

        return this.getNodeOrder(leftNode.id, nodeOrderById)
          - this.getNodeOrder(rightNode.id, nodeOrderById);
      });

      // 2. If parent layer has multiple parents and current layer wraps (more than cols nodes),
      // optimize slot alignment to put right-leaning nodes in the rightmost column (index % cols === cols - 1)
      const width = this.viewportWidth();
      const cols = width >= 950 ? 3 : 2;

      if (prevLayer.length > 1 && layers[d].length > cols) {
        const sortedNodes = [...layers[d]];
        const N = sortedNodes.length;

        // Identify if a node is connected to any parent at index > 0 (right-leaning)
        const isRightLeaning = (node: CourseNode): boolean => {
          const parentIds = parentIdsByChildId.get(node.id) ?? [];
          return parentIds.some(id => {
            const idx = parentIndexMap.get(id);
            return idx !== undefined && idx > 0;
          });
        };

        const rightLeaning = sortedNodes.filter(node => isRightLeaning(node));
        const leftLeaning = sortedNodes.filter(node => !isRightLeaning(node));

        const result = new Array<CourseNode | null>(N).fill(null);

        // Pre-allocate right-leaning nodes to rightmost column slots (index % cols === cols - 1)
        let rightIdx = 0;
        for (let i = 0; i < N; i++) {
          if (i % cols === cols - 1 && rightIdx < rightLeaning.length) {
            result[i] = rightLeaning[rightIdx++];
          }
        }

        // Place any remaining right-leaning nodes that didn't fit in rightmost column slots
        // into leftLeaning / fallback to be distributed in other slots
        const remainingRightLeaning = rightLeaning.slice(rightIdx);
        const remainingNodesToDistribute = [...leftLeaning, ...remainingRightLeaning];

        // Fill all remaining empty slots in order
        let distIdx = 0;
        for (let i = 0; i < N; i++) {
          if (result[i] === null && distIdx < remainingNodesToDistribute.length) {
            result[i] = remainingNodesToDistribute[distIdx++];
          }
        }

        // Filter out any nulls just in case, and assign back to layers[d]
        layers[d] = result.filter((node): node is CourseNode => node !== null);
      }
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

  private clamp(value: number, minimum: number, maximum: number): number {
    return Math.min(maximum, Math.max(minimum, value));
  }

  private centerTreeScrollbarIfNeeded(): void {
    if (!this.isBrowser) {
      return;
    }

    const hostElement = this.hostElement.nativeElement;
    const wrapper = hostElement.querySelector('.course-tree-wrapper') as HTMLElement | null;
    if (!wrapper) {
      return;
    }

    const hasHorizontalOverflow = wrapper.scrollWidth > wrapper.clientWidth;
    const layoutKey = `${wrapper.clientWidth}|${wrapper.scrollWidth}|${this.connectorPaths().length}|${this.nodes().length}`;
    if (!hasHorizontalOverflow) {
      this.lastCenteredScrollLayoutKey = layoutKey;
      return;
    }

    if (layoutKey === this.lastCenteredScrollLayoutKey) {
      return;
    }

    wrapper.scrollLeft = Math.max(0, (wrapper.scrollWidth - wrapper.clientWidth) / 2);
    this.lastCenteredScrollLayoutKey = layoutKey;
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
