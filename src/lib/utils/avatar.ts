/**
 * Address-based Avatar Generation Utility
 * Generates deterministic, unique avatars based on wallet addresses
 */

/**
 * Generate a hash from a string
 */
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
}

/**
 * Generate a consistent color palette based on address
 */
export function generateColorFromAddress(address: string): {
  primary: string;
  secondary: string;
  accent: string;
  hue: number;
} {
  const hash = hashString(address);
  const hue = hash % 360;

  return {
    primary: `hsl(${hue}, 70%, 50%)`,
    secondary: `hsl(${(hue + 60) % 360}, 70%, 50%)`,
    accent: `hsl(${(hue + 120) % 360}, 70%, 60%)`,
    hue,
  };
}

/**
 * Generate gradient style for avatar background
 */
export function generateAvatarGradient(address: string): string {
  const { primary, secondary } = generateColorFromAddress(address);
  return `linear-gradient(135deg, ${primary} 0%, ${secondary} 100%)`;
}

/**
 * Generate SVG data URI for identicon-style avatar
 * Creates a unique 5x5 symmetric pattern
 */
export function generateIdenticonSVG(address: string, size: number = 64): string {
  const hash = hashString(address);
  const { primary, secondary, accent } = generateColorFromAddress(address);

  // Create a 5x5 grid pattern (symmetric on y-axis)
  const grid: boolean[][] = [];
  let hashIndex = 0;

  for (let y = 0; y < 5; y++) {
    grid[y] = [];
    for (let x = 0; x < 3; x++) {
      // Use different parts of hash for each cell
      const bit = ((hash >> (hashIndex % 32)) & 1) === 1;
      grid[y][x] = bit;
      // Mirror for symmetry
      if (x < 2) {
        grid[y][4 - x] = bit;
      }
      hashIndex++;
    }
    grid[y][2] = ((hash >> (hashIndex % 32)) & 1) === 1;
  }

  const cellSize = size / 5;
  let rects = '';

  for (let y = 0; y < 5; y++) {
    for (let x = 0; x < 5; x++) {
      if (grid[y][x]) {
        const color = (x + y) % 2 === 0 ? primary : accent;
        rects += `<rect x="${x * cellSize}" y="${y * cellSize}" width="${cellSize}" height="${cellSize}" fill="${color}"/>`;
      }
    }
  }

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    <rect width="${size}" height="${size}" fill="${secondary}"/>
    ${rects}
  </svg>`;

  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

/**
 * Generate avatar URL - either custom image or generated identicon
 */
export function getAvatarUrl(address: string, customImageUrl?: string | null): string {
  if (customImageUrl) {
    return customImageUrl;
  }
  return generateIdenticonSVG(address);
}

/**
 * Get initials from address
 */
export function getAddressInitials(address: string): string {
  return address.slice(0, 2).toUpperCase();
}

/**
 * Truncate wallet address for display
 */
export function truncateAddress(address: string, startChars: number = 4, endChars: number = 4): string {
  if (address.length <= startChars + endChars) {
    return address;
  }
  return `${address.slice(0, startChars)}...${address.slice(-endChars)}`;
}

/**
 * Generate a display name from address
 */
export function generateDisplayName(address: string, userNumber?: number): string {
  if (userNumber) {
    return `Whale #${userNumber}`;
  }
  return `Whale ${address.slice(0, 6)}`;
}

/**
 * Check if a URL is a Cloudinary URL
 */
export function isCloudinaryUrl(url: string): boolean {
  return url.includes('cloudinary.com') || url.includes('res.cloudinary.com');
}

/**
 * Get Cloudinary transformed URL
 */
export function getCloudinaryTransformedUrl(url: string, width: number = 200, height: number = 200): string {
  if (!isCloudinaryUrl(url)) {
    return url;
  }
  // Insert transformation parameters
  const parts = url.split('/upload/');
  if (parts.length === 2) {
    return `${parts[0]}/upload/w_${width},h_${height},c_fill,f_auto,q_auto/${parts[1]}`;
  }
  return url;
}

export default {
  generateColorFromAddress,
  generateAvatarGradient,
  generateIdenticonSVG,
  getAvatarUrl,
  getAddressInitials,
  truncateAddress,
  generateDisplayName,
  isCloudinaryUrl,
  getCloudinaryTransformedUrl,
};
