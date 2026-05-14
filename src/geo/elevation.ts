import { fromArrayBuffer } from 'geotiff';

export interface BoundingBox {
  minLat: number; maxLat: number;
  minLng: number; maxLng: number;
}

export async function fetchElevationData(bounds: BoundingBox): Promise<Float32Array> {
  const url = new URL('https://portal.opentopography.org/API/globaldem');
  url.searchParams.set('demtype', 'SRTMGL1');
  url.searchParams.set('south', bounds.minLat.toString());
  url.searchParams.set('north', bounds.maxLat.toString());
  url.searchParams.set('west', bounds.minLng.toString());
  url.searchParams.set('east', bounds.maxLng.toString());
  url.searchParams.set('outputFormat', 'GTiff');

  const resp = await fetch(url.toString());
  const buffer = await resp.arrayBuffer();
  const tiff = await fromArrayBuffer(buffer);
  const image = await tiff.getImage();
  const raster = await image.readRasters({ interleave: true });
  return raster as unknown as Float32Array;
}
