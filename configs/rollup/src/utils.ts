import { PackageJson } from 'type-fest';

export function ensure(value: string | null | undefined, message: Error['message']) {
  if (value == null) {
    throw new Error(message);
  }

  return value;
}

export const EXTENSIONS = ['.js', '.jsx', '.ts', '.tsx'];

export const FORMAT = {
  NODE: {
    TYPE: 'cjs',
    SYNTAX: 'require',
  },
  BROWSER: {
    TYPE: 'esm', // @TODO: Need to extends the real rollup extensions
    SYNTAX: 'import',
  },
} as const;

// @TODO: Need to bundle it based on the purpose,
export interface EnchantPackageJson extends Omit<PackageJson, 'author' | 'bin'> {
  purpose: 'node-cjs' | 'node-esm' | 'browser-esm';
  output: Record<string, { require: string; import: string; types: string }>;
  tsconfig: string;
}
