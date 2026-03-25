export default {
  plugins: {
    '@tailwindcss/postcss': {
      config: './tailwind.config.js'
      // exclude: [':root', 'html', 'body'],
      // transform(prefix, selector, prefixedSelector, filePath) {
        // Не применяем префикс к псевдо-элементам и ключевым кадрам
        // if (selector.startsWith('@')) return selector;
        // if (selector.includes('::')) return selector;
        // return prefixedSelector;
      // }
    },
  },
}