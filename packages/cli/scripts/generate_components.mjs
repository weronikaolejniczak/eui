/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0 and the Server Side Public License, v 1; you may not use this file except
 * in compliance with, at your election, the Elastic License 2.0 or the Server
 * Side Public License, v 1.
 */

import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import ts from 'typescript';

const packageRoot = fileURLToPath(new URL('..', import.meta.url));
const repoRoot = path.resolve(packageRoot, '../..');
const euiEntryPoint = path.join(repoRoot, 'packages/eui/src/index.ts');
const outputPath = path.join(packageRoot, 'src/data/components.json');

const program = ts.createProgram([euiEntryPoint], {
  jsx: ts.JsxEmit.ReactJSX,
  module: ts.ModuleKind.CommonJS,
  moduleResolution: ts.ModuleResolutionKind.Node10,
  skipLibCheck: true,
  target: ts.ScriptTarget.ES2020,
});
const checker = program.getTypeChecker();
const sourceFile = program.getSourceFile(euiEntryPoint);

if (!sourceFile) {
  throw new Error(`Could not load EUI entry point at ${euiEntryPoint}`);
}

const moduleSymbol = checker.getSymbolAtLocation(sourceFile);

if (!moduleSymbol) {
  throw new Error('Could not resolve exports from the EUI entry point');
}

const isCallable = (type) =>
  checker.getSignaturesOfType(type, ts.SignatureKind.Call).length > 0 ||
  checker.getSignaturesOfType(type, ts.SignatureKind.Construct).length > 0;

const isCompoundComponent = (type) => {
  const properties = type.getProperties();

  return (
    properties.length > 0 &&
    properties.every((property) => {
      const declaration =
        property.valueDeclaration ?? property.declarations?.[0];

      return (
        /^[A-Z]/.test(property.name) &&
        declaration &&
        isCallable(checker.getTypeOfSymbolAtLocation(property, declaration))
      );
    })
  );
};

const components = checker
  .getExportsOfModule(moduleSymbol)
  .filter((symbol) => /^Eui[A-Z]/.test(symbol.name))
  .filter((symbol) => {
    const target =
      symbol.flags & ts.SymbolFlags.Alias
        ? checker.getAliasedSymbol(symbol)
        : symbol;
    const declarations = target.getDeclarations() ?? [];
    const declaration = declarations[0];

    if (!declaration) {
      return false;
    }

    const type = checker.getTypeOfSymbolAtLocation(target, declaration);
    const isComponent = isCallable(type) || isCompoundComponent(type);

    return Boolean(target.flags & ts.SymbolFlags.Value) && isComponent;
  })
  .map((symbol) => symbol.name)
  .sort((left, right) => left.localeCompare(right));

if (components.length === 0) {
  throw new Error('Component generation produced an empty index');
}

const output = `${JSON.stringify(components, null, 2)}\n`;

if (process.argv.includes('--check')) {
  const currentOutput = await readFile(outputPath, 'utf8').catch(() => '');

  if (currentOutput !== output) {
    throw new Error(
      'The component index is out of date. Run `yarn generate` from packages/cli.'
    );
  }
} else {
  await mkdir(path.dirname(outputPath), { recursive: true });
  await writeFile(outputPath, output);
  console.log(`Generated ${components.length} components.`);
}
