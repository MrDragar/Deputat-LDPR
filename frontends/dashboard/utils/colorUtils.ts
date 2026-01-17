// A simple hash function to get a value from a string
const simpleHash = (str: string): number => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = (hash << 5) - hash + char;
        hash |= 0; // Convert to 32bit integer
    }
    return Math.abs(hash);
};

// Generate a color from a string hash.
const generateColor = (str: string): string => {
    const hash = simpleHash(str);
    // Use HSL color space for more pleasant and distinct colors
    const h = hash % 360; // Hue
    const s = 60 + (hash % 20); // Saturation (60-80%)
    const l = 50 + (hash % 15); // Lightness (50-65%)
    return `hsl(${h}, ${s}%, ${l}%)`;
};

export const getAppealColors = (topics: string[]): Record<string, string> => {
    const colors: Record<string, string> = {};
    topics.forEach(topic => {
        colors[topic] = generateColor(topic);
    });
    return colors;
};
