import { EnchantPackageJson, FORMAT } from './utils';

interface IHandleEntryArgs {
  type: typeof FORMAT.NODE.SYNTAX | typeof FORMAT.BROWSER.SYNTAX;
  exports: EnchantPackageJson['exports'];
  entrypoint: string;
}

export const handleESMEntrypoint = (
  exports: EnchantPackageJson['exports'],
  entrypoint: string
): string | undefined | null => retrieveEntryPoint({ type: FORMAT.NODE.SYNTAX, exports, entrypoint });

export const handleCJSEntrypoint = (
  exports: EnchantPackageJson['exports'],
  entrypoint: string
): string | undefined | null => retrieveEntryPoint({ type: FORMAT.BROWSER.SYNTAX, exports, entrypoint });

function retrieveEntryPoint({ type, exports, entrypoint }: IHandleEntryArgs): string | undefined | null {
  if (typeof exports === 'string') {
    return exports;
  }

  if (Array.isArray(exports)) {
    for (const item of exports) {
      const result = retrieveEntryPoint({
        type,
        exports: item,
        entrypoint: type,
      });
      if (result) {
        return result;
      }
    }
    return undefined;
  }

  if (typeof exports === 'object' && !Array.isArray(exports)) {
    // @ts-ignore
    const entry = exports?.[entrypoint];

    if (typeof entry === 'string') {
      return entry;
    }

    if (typeof entry === 'object' && entry !== null && type in entry) {
      const typedEntry = entry as { [key in 'import' | 'require']?: string };
      return typedEntry[type];
    }
  }

  return undefined;
}
