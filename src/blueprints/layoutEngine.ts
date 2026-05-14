export interface LayoutNode {
  id: string;
  type: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
}

export function autoLayout(
  nodes: LayoutNode[],
  canvasWidth: number,
  canvasHeight: number
): LayoutNode[] {
  const padding = 20;
  let x = padding;
  let y = padding;
  let rowHeight = 0;

  return nodes.map(node => {
    if (x + node.width > canvasWidth - padding) {
      x = padding;
      y += rowHeight + padding;
      rowHeight = 0;
    }

    const positioned = { ...node, x, y };
    x += node.width + padding;
    rowHeight = Math.max(rowHeight, node.height);
    return positioned;
  });
}

export function snapToGrid(x: number, y: number, gridSize = 12): { x: number; y: number } {
  return {
    x: Math.round(x / gridSize) * gridSize,
    y: Math.round(y / gridSize) * gridSize,
  };
}
