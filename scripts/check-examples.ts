import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as ts from 'typescript';

function walk(dir: string): string[] {
  const out: string[] = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const f = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...walk(f));
    else if (f.endsWith('.ts')) out.push(f);
  }
  return out;
}

function hasExamples(file: string): boolean {
  const sf = ts.createSourceFile(file, fs.readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, true);
  let found = false;
  function visit(node: ts.Node) {
    if (
      ts.isPropertyDeclaration(node) &&
      ts.isIdentifier(node.name) &&
      node.name.text === 'examples' &&
      node.initializer &&
      ts.isArrayLiteralExpression(node.initializer) &&
      node.initializer.elements.length > 0
    ) {
      found = true;
    }
    if (!found) ts.forEachChild(node, visit);
  }
  visit(sf);
  return found;
}

const files = walk(path.resolve(process.cwd(), 'src/commands')).filter((f) => !f.endsWith('.gitkeep'));
const missing = files.filter((f) => !hasExamples(f));
if (missing.length) {
  console.error(`${missing.length} commands without examples:`);
  for (const f of missing) console.error(`  ${f}`);
  process.exit(1);
}
console.log(`All ${files.length} commands have at least one example.`);
