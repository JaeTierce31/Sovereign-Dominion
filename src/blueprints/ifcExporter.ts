import { IfcAPI, IFCBUILDING, IFCWALL, IFCSLAB } from 'web-ifc';

export interface BlueprintElement {
  id: string;
  type: string;
  geometry?: any;
  material: string;
  quantity: number;
  unit: string;
}

export async function exportIFC(elements: BlueprintElement[], projectName: string): Promise<Uint8Array> {
  const ifc = new IfcAPI();
  await ifc.Init();
  const modelID = ifc.OpenModel();
  (ifc as any).BeginModel(modelID);

  (ifc as any).CreateIfcEntity(modelID, IFCBUILDING, { Name: projectName });

  for (const el of elements) {
    switch (el.type) {
      case 'retaining_wall': {
        (ifc as any).CreateIfcEntity(modelID, IFCWALL, { Name: el.id });
        break;
      }
      case 'patio': {
        (ifc as any).CreateIfcEntity(modelID, IFCSLAB, { Name: el.id });
        break;
      }
    }
  }

  (ifc as any).EndModel(modelID);
  const data = (ifc as any).SaveModel(modelID);
  ifc.CloseModel(modelID);
  return data;
}
