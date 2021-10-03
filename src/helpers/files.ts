import { tsImport } from 'ts-import';

import { createRequire } from 'module';
import * as module from 'module';

import { readFileSync, readdirSync, Dirent } from 'fs';

import path from 'path';

import { ModuleResolver, ModuleNameResolver, RecursiveStruct } from '../types';

export const getFileSizeKb = (str: string): number =>
  Buffer.byteLength(str, 'utf8') / 1000;

export const isSubstrInFile = (filePath: string, substr: string): boolean => {
  const file = readFileSync(filePath).toString();

  return file.includes(substr);
};

export const resolveFile = async (
  filePath: string,
  resolver: ModuleResolver = (m) => m,
): Promise<RecursiveStruct> => {
  const [, ext] = filePath.match(/\.([0-9a-z]+)(?:[?#]|$)/i) || [];
  let m = {};

  if (ext === 'ts') {
    m = await tsImport.compile(filePath);
  } else if (ext === 'js') {
    let r = createRequire(import.meta.url);
    r = r('esm')(m /*, options*/);
    m = r(filePath);
  } else if (ext === 'json') {
    const r = createRequire(import.meta.url);
    m = r(filePath);
  }

  return resolver(m);
};

const useFileNameResolver = (
  resolver: ModuleNameResolver,
  name: string,
): boolean => {
  if (resolver instanceof RegExp) {
    return resolver.test(name);
  }
  if (typeof resolver === 'function') {
    return resolver(name);
  }

  return false;
};

interface options {
  extensions?: string[];
  fileNameResolver?: ModuleNameResolver;
}

export const generateFilesPaths = (
  srcPath: string,
  { extensions, fileNameResolver }: options,
): string[] => {
  const entries: Dirent[] = readdirSync(srcPath, { withFileTypes: true });

  const files = entries.map(async (dirent: Dirent): Promise<string | string[]> => {
    const nextPath: string = path.resolve(srcPath, dirent.name);

    return dirent.isDirectory()
      ? generateFilesPaths(nextPath, { extensions, fileNameResolver })
      : nextPath;
  })

  return Array.prototype.concat(...files).filter((v) => {
    const name = path.basename(v);

    if (extensions) {
      const [, ext] = name.match(/\.([0-9a-z]+)(?:[?#]|$)/i) || [];

      return extensions.some((_ext: string) => {
        if (_ext === ext && fileNameResolver) {
          return useFileNameResolver(fileNameResolver, name);
        }

        return _ext === ext;
      });
    }

    return fileNameResolver
      ? useFileNameResolver(fileNameResolver, name)
      : false;
  });
};
