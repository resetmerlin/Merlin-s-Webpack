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
    TYPE: 'esm',
    SYNTAX: 'import',
  },
} as const;
