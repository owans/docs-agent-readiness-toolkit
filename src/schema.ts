import { readFile } from "node:fs/promises";
import { Ajv, type ErrorObject, type ValidateFunction } from "ajv/dist/ajv.js";

const validators = new Map<string, ValidateFunction>();
const ajv = new Ajv({ allErrors: true, strict: true });

export class SchemaValidationError extends Error {
  readonly errors: ErrorObject[];

  constructor(schemaName: string, errors: ErrorObject[]) {
    super(
      `${schemaName} validation failed: ${errors
        .map((error) => `${error.instancePath || "/"} ${error.message ?? "is invalid"}`)
        .join("; ")}`,
    );
    this.name = "SchemaValidationError";
    this.errors = errors;
  }
}

async function validator(schemaName: string): Promise<ValidateFunction> {
  const existing = validators.get(schemaName);
  if (existing) {
    return existing;
  }
  const url = new URL(`../schemas/v1/${schemaName}.schema.json`, import.meta.url);
  const schema = JSON.parse(await readFile(url, "utf8")) as object;
  const compiled = ajv.compile(schema);
  validators.set(schemaName, compiled);
  return compiled;
}

export async function validateSchema(schemaName: string, value: unknown): Promise<void> {
  const validate = await validator(schemaName);
  if (!validate(value)) {
    throw new SchemaValidationError(schemaName, validate.errors ?? []);
  }
}
