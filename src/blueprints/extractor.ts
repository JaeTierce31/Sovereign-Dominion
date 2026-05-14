import { BlueprintElement } from './ifcExporter';

export interface SceneObject {
  id: string;
  type: string;
  dimensions: { length?: number; width?: number; height?: number };
  position: { x: number; y: number; z: number };
  material: string;
  quantity?: number;
}

export function extractBlueprintElements(objects: SceneObject[]): BlueprintElement[] {
  return objects.map(obj => ({
    id: obj.id,
    type: obj.type,
    material: obj.material,
    quantity: obj.quantity ?? 1,
    unit: getDefaultUnit(obj.type),
    geometry: obj.dimensions,
  }));
}

function getDefaultUnit(type: string): string {
  const unitMap: Record<string, string> = {
    retaining_wall: 'block',
    patio: 'sqft',
    deck: 'sqft',
    mulch: 'bag',
    gravel: 'ton',
  };
  return unitMap[type] ?? 'each';
}
