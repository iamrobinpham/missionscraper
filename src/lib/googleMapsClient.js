import googleMaps from '@google/maps';

let googleMap;

export default function getGMClient() {
  const GOOGLE_MAPS_KEY = process.env.GOOGLE_MAPS_KEY;
  if (!googleMap) {
    googleMap = googleMaps.createClient({
      key: GOOGLE_MAPS_KEY,
    });
  }
  return googleMap;
}
