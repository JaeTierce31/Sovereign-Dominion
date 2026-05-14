import jsPDF from 'jspdf';
import { proveMaterialList } from './qssm';

export function generateProposalPdf(
  projectName: string,
  materials: { name: string; quantity: number; price: number }[],
  laborCost: number
): Blob {
  const doc = new jsPDF('l', 'mm', 'a2');
  doc.setFontSize(18);
  doc.text(`Project Proposal: ${projectName}`, 10, 10);
  doc.setFontSize(12);

  let y = 30;
  doc.text('Material Schedule', 10, y);
  y += 10;
  materials.forEach((m, i) => {
    doc.text(`${m.quantity}x ${m.name} @ $${m.price.toFixed(2)} = $${(m.quantity * m.price).toFixed(2)}`, 10, y + i * 10);
  });
  y += materials.length * 10 + 5;

  const totalMat = materials.reduce((sum, m) => sum + m.quantity * m.price, 0);
  doc.text(`Material Total: $${totalMat.toFixed(2)}`, 10, y);
  doc.text(`Labor: $${laborCost.toFixed(2)}`, 10, y + 10);
  doc.text(`Grand Total: $${(totalMat + laborCost).toFixed(2)}`, 10, y + 20);

  const proof = proveMaterialList(materials);
  const proofBase64 = btoa(String.fromCharCode(...proof));
  (doc as any).addFileToVFS('proof.bin', proofBase64);

  y += 30;
  doc.text('Cryptographic Proof: QSSM lattice‑based ZKP (embedded)', 10, y);

  return doc.output('blob');
}
