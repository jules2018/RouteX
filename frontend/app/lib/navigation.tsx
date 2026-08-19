export const openNavigation = (
  latitude: number,
  longitude: number
) => {
  if (!latitude || !longitude) {
    alert("Navigation coordinates unavailable");
    return;
  }

  const googleMapsUrl =
    "https://www.google.com/maps/dir/?api=1&destination=" +
    latitude +
    "," +
    longitude;

  window.open(googleMapsUrl, "_blank");
};