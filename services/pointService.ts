export const POINT_CONFIG = {
  FEED_PHOTO: 10,
  FEED_VIDEO: 20,
  FEED_24H_BONUS: 5,
  CCTV_CAPTURE_BONUS: 5,
};

export async function checkLocationDuplicate(
  _userId: string,
  _mediaType: string,
  _lat: number,
  _lon: number
): Promise<boolean> {
  return false;
}

export async function grantPoints(
  _userId: string,
  _type: string,
  _points: number,
  _description: string,
  _meta?: object
): Promise<void> {
  // stub
}

export function isWithin24Hours(dateStr: string): boolean {
  const date = new Date(dateStr);
  return Date.now() - date.getTime() < 24 * 60 * 60 * 1000;
}
