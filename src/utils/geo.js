/**
 * Reverse geocode coordinates to get location name and address.
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @param {string} lang - Language code (default: "ar")
 * @returns {Promise<{ name: string, address: string }>}
 */
export async function reverseGeocode(lat, lng, lang = "ar") {
    try {
        const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&accept-language=${lang}`
        );
        const data = await res.json();
        return {
            name: data.name || data.display_name?.split(",")[0] || "",
            address: data.display_name || "",
        };
    } catch (error) {
        console.error("Reverse geocoding error:", error);
        return { name: "", address: "" };
    }
}
