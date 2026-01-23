export function getUser() {
	if (typeof window === 'undefined') return null

	try {
		const raw = localStorage.getItem("user")
		if (!raw) return null

		return JSON.parse(raw)
	} catch (error) {
		console.error('Failed to read auth from localStorage', error)
		return null
	}
}