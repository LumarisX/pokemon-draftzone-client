import { Options } from 'prettier';

const config: Options = {
  semi: true,
  singleQuote: true,
  trailingComma: 'all',
  printWidth: 80,
  tabWidth: 2,
  useTabs: false,
  quoteProps: 'as-needed',
  jsxSingleQuote: false,
  arrowParens: 'always',
  endOfLine: 'lf',
  proseWrap: 'never',
  htmlWhitespaceSensitivity: 'css',
  plugins: ['prettier-plugin-tailwindcss'],
};

export default config;
