import WebFont from 'webfontloader';

/**
 * Capitalizes the first letter of each word in a font name.
 * @param name The font name string.
 * @returns Capitalized font name.
 */
export const capitalizeFontName = (name: string): string => {
  return name
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

/**
 * Loads a Google Font using WebFontLoader and returns a promise indicating success.
 * @param fontFamily The name of the Google Font family.
 * @returns Promise<boolean> Resolves true if the font becomes active, false otherwise.
 */
export const loadGoogleFont = (fontFamily: string): Promise<boolean> => {
  // Format for API: Hyphen -> Space, then Capitalize
  const nameWithSpaces = fontFamily.replace(/-/g, ' ');
  const capitalizedFamily = capitalizeFontName(nameWithSpaces);

  return new Promise((resolve) => {
    console.log(`[WebFontLoader] Attempting to load font: ${capitalizedFamily} (Original: ${fontFamily})`);
    WebFont.load({
      custom: {
        // Pass font family name separately
        families: [capitalizedFamily], // Use capitalized name with spaces
        // Construct the correct CSS API v2 URL
        urls: [
          `https://fonts.googleapis.com/css2?family=${capitalizedFamily.replace(/ /g, '+')}:wght@100;200;300;400;500;600;700;800;900&display=swap` // Use capitalized name, replace space with +
        ]
      },
      active: () => {
        console.log(`[WebFontLoader] Font active: ${capitalizedFamily}`);
        resolve(true);
      },
      inactive: () => {
        console.error(`[WebFontLoader] Font inactive (failed to load): ${capitalizedFamily}`);
        resolve(false); // Resolve false on failure
      },
      // Optional: Add a timeout if needed
      // timeout: 3000 // e.g., 3 seconds
    });
  });
}; 