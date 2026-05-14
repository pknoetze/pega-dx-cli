import inquirer from 'inquirer';

export interface ActionSummary {
  id: string;
  label: string;
}

export interface FieldDef {
  fieldId: string;
  label: string;
  type: 'text' | 'number' | 'boolean' | 'date' | 'datetime';
  required: boolean;
}

interface RawAction {
  ID?: string;
  id?: string;
  name?: string;
  label?: string;
}

function toActionSummary(raw: RawAction): ActionSummary | undefined {
  const id = raw.ID ?? raw.id;
  if (!id || typeof id !== 'string') return undefined;
  const label = raw.name ?? raw.label ?? id;
  return { id, label };
}

export function extractActions(parentResponse: unknown): ActionSummary[] {
  if (!parentResponse || typeof parentResponse !== 'object') return [];
  const r = parentResponse as Record<string, unknown>;
  const seen = new Set<string>();
  const out: ActionSummary[] = [];

  // Shape 1: top-level actions[]
  if (Array.isArray(r.actions)) {
    for (const raw of r.actions as RawAction[]) {
      const s = toActionSummary(raw);
      if (s && !seen.has(s.id)) {
        seen.add(s.id);
        out.push(s);
      }
    }
  }

  // Shape 2: data.caseInfo.assignments[].actions[]
  const data = r.data as Record<string, unknown> | undefined;
  const caseInfo = data?.caseInfo as Record<string, unknown> | undefined;
  const assignments = caseInfo?.assignments as Array<Record<string, unknown>> | undefined;
  if (Array.isArray(assignments)) {
    for (const a of assignments) {
      const acts = a.actions as RawAction[] | undefined;
      if (Array.isArray(acts)) {
        for (const raw of acts) {
          const s = toActionSummary(raw);
          if (s && !seen.has(s.id)) {
            seen.add(s.id);
            out.push(s);
          }
        }
      }
    }
  }

  return out;
}

const TYPE_MAP: Record<string, FieldDef['type']> = {
  pxTextInput: 'text',
  pxTextArea: 'text',
  pxEmail: 'text',
  pxPhone: 'text',
  pxURL: 'text',
  pxIdentifier: 'text',
  pxInteger: 'number',
  pxNumber: 'number',
  pxDecimal: 'number',
  pxCurrency: 'number',
  pxCheckbox: 'boolean',
  pyBoolean: 'boolean',
  Checkbox: 'boolean',
  pxDate: 'date',
  pxDateTime: 'datetime',
};

function mapFieldType(pegaType: string | undefined, baseLabel: string): { type: FieldDef['type']; label: string } {
  if (!pegaType) return { type: 'text', label: baseLabel };
  const mapped = TYPE_MAP[pegaType];
  if (mapped) return { type: mapped, label: baseLabel };
  return { type: 'text', label: `${baseLabel} (${pegaType})` };
}

interface RawFieldMeta {
  type?: string;
  label?: string;
  required?: boolean;
}

function pushField(
  out: FieldDef[],
  seen: Set<string>,
  fieldId: string,
  meta: RawFieldMeta,
): void {
  if (!meta.required) return;
  if (seen.has(fieldId)) return;
  seen.add(fieldId);
  const baseLabel = meta.label ?? fieldId;
  const { type, label } = mapFieldType(meta.type, baseLabel);
  out.push({ fieldId, label, type, required: true });
}

function walkChildren(
  node: Record<string, unknown>,
  out: FieldDef[],
  seen: Set<string>,
): void {
  if (node.type === 'Field') {
    const fieldId = (node.fieldID ?? node.reference) as string | undefined;
    if (fieldId) {
      const cfg = (node.config ?? {}) as RawFieldMeta;
      pushField(out, seen, fieldId, {
        type: cfg.type,
        label: (node.label as string | undefined) ?? cfg.label,
        required: cfg.required,
      });
    }
  }
  const children = node.children as Array<Record<string, unknown>> | undefined;
  if (Array.isArray(children)) {
    for (const c of children) walkChildren(c, out, seen);
  }
}

export function extractFields(view: unknown): FieldDef[] {
  if (!view || typeof view !== 'object') return [];
  const r = view as Record<string, unknown>;
  const ui = r.uiResources as Record<string, unknown> | undefined;
  if (!ui) return [];

  const seen = new Set<string>();
  const out: FieldDef[] = [];

  // Shape 1: uiResources.resources.fields map
  const resources = ui.resources as Record<string, unknown> | undefined;
  const fieldsMap = resources?.fields as Record<string, RawFieldMeta> | undefined;
  if (fieldsMap && typeof fieldsMap === 'object') {
    for (const [fieldId, meta] of Object.entries(fieldsMap)) {
      pushField(out, seen, fieldId, meta);
    }
  }

  // Shape 2: uiResources.root.children[*] recursive
  const root = ui.root as Record<string, unknown> | undefined;
  if (root) walkChildren(root, out, seen);

  return out;
}

export function validateRequiredText(value: string): true | string {
  return value.trim().length > 0 ? true : 'Value is required';
}

export function validateNumber(value: string): true | string {
  if (value === '' || value === null || value === undefined) return 'Must be a number';
  const n = Number(value);
  return Number.isFinite(n) ? true : 'Must be a number';
}

export function validateDate(value: string): true | string {
  if (value === '' || value === null || value === undefined) return 'Value is required';
  return Number.isFinite(new Date(value).getTime()) ? true : 'Must be a valid date';
}

export function validateDateTime(value: string): true | string {
  if (value === '' || value === null || value === undefined) return 'Value is required';
  return Number.isFinite(new Date(value).getTime()) ? true : 'Must be a valid date/time';
}

export function isInteractiveTTY(): boolean {
  return Boolean(process.stdin.isTTY && process.stdout.isTTY);
}

// --- Prompt runner shim (swappable for tests) ---

export type PromptRunner = (questions: ReadonlyArray<Record<string, unknown>>) => Promise<Record<string, unknown>>;

const defaultRunner: PromptRunner = async (questions) =>
  inquirer.prompt(questions as never, { output: process.stderr } as never) as Promise<Record<string, unknown>>;

let activeRunner: PromptRunner = defaultRunner;

export function setPromptRunner(runner: PromptRunner): void {
  activeRunner = runner;
}

export function resetPromptRunner(): void {
  activeRunner = defaultRunner;
}

function isExitPromptError(err: unknown): boolean {
  return (
    !!err &&
    typeof err === 'object' &&
    ((err as { name?: string }).name === 'ExitPromptError' ||
      (err as { constructor?: { name?: string } }).constructor?.name === 'ExitPromptError')
  );
}

const USER_CANCELLED = { code: 'USER_CANCELLED' as const };

async function runOrCancel(questions: ReadonlyArray<Record<string, unknown>>): Promise<Record<string, unknown>> {
  try {
    return await activeRunner(questions);
  } catch (err) {
    if (isExitPromptError(err)) throw USER_CANCELLED;
    throw err;
  }
}

// --- pickAction ---

export async function pickAction(actions: ActionSummary[]): Promise<string> {
  const answers = await runOrCancel([
    {
      type: 'list',
      name: 'action',
      message: 'Select an action:',
      choices: actions.map((a) => ({ name: a.label, value: a.id })),
    },
  ]);
  return answers.action as string;
}

// --- promptFields ---

function promptForField(f: FieldDef): Record<string, unknown> {
  const base = { name: f.fieldId, message: `${f.label}:` };
  if (f.type === 'boolean') return { ...base, type: 'confirm', default: false };
  if (f.type === 'number') return { ...base, type: 'number', validate: validateNumber };
  if (f.type === 'date') return { ...base, type: 'input', validate: validateDate };
  if (f.type === 'datetime') return { ...base, type: 'input', validate: validateDateTime };
  return { ...base, type: 'input', validate: validateRequiredText };
}

export async function promptFields(fields: FieldDef[]): Promise<Record<string, unknown>> {
  if (fields.length === 0) return {};
  const questions = fields.map(promptForField);
  return runOrCancel(questions);
}

// --- confirmSubmit ---

export async function confirmSubmit(body: unknown): Promise<boolean> {
  process.stderr.write('\nAbout to submit:\n');
  process.stderr.write(JSON.stringify(body, null, 2) + '\n');
  const answers = await runOrCancel([
    { type: 'confirm', name: 'confirmed', message: 'Submit?', default: false },
  ]);
  return Boolean(answers.confirmed);
}
