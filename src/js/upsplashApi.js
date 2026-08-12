
const ACCESS_KEY = "TQ6YjcW0dndQZYb3op6xn6eP8k5beU24OOLdaT6Ulfo";

export async function searchUnsplashPhotos(query, count = 4) {
  const response = await fetch(
    `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=${count}&client_id=${ACCESS_KEY}`
  );
  if (!response.ok) return [];
  const data = await response.json();
  return data.results.map(photo => photo.urls.small);
}