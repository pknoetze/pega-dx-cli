import * as fs from 'node:fs';
import * as path from 'node:path';
import * as ts from 'typescript';
import yaml from 'js-yaml';

export interface SpecOperation {
  path: string;
  method: string;
  operationId?: string;
  summary?: string;
}

export interface CommandEndpoint {
  file: string;
  path: string | null;
  method: string | null;
}

export interface SpecDocument {
  version: string;
  operations: SpecOperation[];
}

const VERBS = new Set(['get', 'post', 'put', 'patch', 'delete']);

export function extractSpecOperations(yamlPath: string): SpecDocument {
  const doc = yaml.load(fs.readFileSync(yamlPath, 'utf8')) as {
    info?: { version?: string };
    paths?: Record<string, Record<string, { operationId?: string; summary?: string }>>;
  };
  const ops: SpecOperation[] = [];
  for (const [p, methods] of Object.entries(doc.paths ?? {})) {
    for (const [verb, op] of Object.entries(methods)) {
      if (!VERBS.has(verb.toLowerCase())) continue;
      if (!op) continue;
      ops.push({
        path: p,
        method: verb.toUpperCase(),
        operationId: op.operationId,
        summary: op.summary,
      });
    }
  }
  return { version: doc.info?.version ?? 'unknown', operations: ops };
}

export function extractCommandEndpoints(commandsRoot: string): CommandEndpoint[] {
  const files = walk(commandsRoot).filter((f) => f.endsWith('.ts'));
  return files.map((file) => readEndpoint(file));
}

function walk(dir: string): string[] {
  const out: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full));
    else out.push(full);
  }
  return out;
}

function readEndpoint(file: string): CommandEndpoint {
  const src = fs.readFileSync(file, 'utf8');
  const sf = ts.createSourceFile(file, src, ts.ScriptTarget.Latest, true);
  let result: CommandEndpoint = { file, path: null, method: null };
  ts.forEachChild(sf, (node) => {
    if (
      ts.isVariableStatement(node) &&
      node.modifiers?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword)
    ) {
      for (const decl of node.declarationList.declarations) {
        if (ts.isIdentifier(decl.name) && decl.name.text === '__endpoint' && decl.initializer) {
          const init = unwrapAsConst(decl.initializer);
          if (ts.isObjectLiteralExpression(init)) {
            const obj = readObjectLiteral(init);
            if (typeof obj.path === 'string' && typeof obj.method === 'string') {
              result = { file, path: obj.path, method: obj.method.toUpperCase() };
            }
          }
        }
      }
    }
  });
  return result;
}

function unwrapAsConst(node: ts.Expression): ts.Expression {
  return ts.isAsExpression(node) ? node.expression : node;
}

function readObjectLiteral(node: ts.ObjectLiteralExpression): Record<string, string> {
  const obj: Record<string, string> = {};
  for (const prop of node.properties) {
    if (ts.isPropertyAssignment(prop) && ts.isIdentifier(prop.name)) {
      if (ts.isStringLiteral(prop.initializer)) {
        obj[prop.name.text] = prop.initializer.text;
      }
    }
  }
  return obj;
}
