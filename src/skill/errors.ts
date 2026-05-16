export type SkillErrorCode = 'INVALID_ARGS' | 'INVALID_CONFIG';

export class SkillError extends Error {
  public readonly code: SkillErrorCode;

  constructor(message: string, code: SkillErrorCode) {
    super(message);
    this.name = 'SkillError';
    this.code = code;
  }
}
