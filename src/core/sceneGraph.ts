import * as THREE from 'three';

export interface SceneNode {
  id: string;
  mesh: THREE.Object3D;
  metadata: Record<string, any>;
  children: string[];
  parent: string | null;
}

export class SceneGraph {
  private nodes: Map<string, SceneNode> = new Map();
  private root: THREE.Scene;

  constructor(scene: THREE.Scene) {
    this.root = scene;
  }

  addNode(node: SceneNode) {
    this.nodes.set(node.id, node);
    if (node.parent) {
      const parent = this.nodes.get(node.parent);
      if (parent) parent.mesh.add(node.mesh);
    } else {
      this.root.add(node.mesh);
    }
  }

  removeNode(id: string) {
    const node = this.nodes.get(id);
    if (!node) return;
    node.mesh.parent?.remove(node.mesh);
    this.nodes.delete(id);
  }

  getNode(id: string): SceneNode | undefined {
    return this.nodes.get(id);
  }

  getAllNodes(): SceneNode[] {
    return Array.from(this.nodes.values());
  }

  getNodesByType(type: string): SceneNode[] {
    return this.getAllNodes().filter(n => n.metadata.type === type);
  }

  updateMetadata(id: string, updates: Record<string, any>) {
    const node = this.nodes.get(id);
    if (node) node.metadata = { ...node.metadata, ...updates };
  }
}
