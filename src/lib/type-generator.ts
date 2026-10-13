// High-performance, zero-dependency TypeScript & Zod code generator for JSON payloads

function toPascalCase(str: string): string {
  if (!str) return "Payload";
  // Handle dots, dashes, underscores, slashes
  return str
    .replace(/[._\-\/\\:]+(\w|$)/g, (_, c) => (c ? c.toUpperCase() : ""))
    .replace(/^\w/, (c) => c.toUpperCase())
    .replace(/[^a-zA-Z0-9]/g, "");
}

function sanitizeIdentifier(name: string): string {
  if (/^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(name)) {
    return name;
  }
  return JSON.stringify(name);
}

function toSingular(key: string): string {
  if (key.endsWith("ies")) {
    return key.slice(0, -3) + "y";
  }
  if (
    key.endsWith("sses") ||
    key.endsWith("shes") ||
    key.endsWith("ches") ||
    key.endsWith("xes")
  ) {
    return key.slice(0, -2);
  }
  if (key.endsWith("s") && !key.endsWith("ss")) {
    return key.slice(0, -1);
  }
  return `${key}Item`;
}

function inferRootName(data: unknown, fallback = "WebhookPayload"): string {
  if (typeof data === "object" && data !== null) {
    const obj = data as Record<string, unknown>;
    if (typeof obj.type === "string") {
      return `${toPascalCase(obj.type)}Payload`;
    }
    if (typeof obj.event === "string") {
      return `${toPascalCase(obj.event)}Payload`;
    }
    if (typeof obj.topic === "string") {
      return `${toPascalCase(obj.topic)}Payload`;
    }
    if (typeof obj.action === "string") {
      return `${toPascalCase(obj.action)}Payload`;
    }
  }
  return fallback;
}

interface TypeExtraction {
  code: string;
  subInterfaces: string[];
}

export function generateTypeScript(
  data: unknown,
  customRootName?: string
): string {
  if (data === null || data === undefined) {
    return "export type WebhookPayload = null | undefined;\n";
  }

  if (typeof data !== "object") {
    return `export type WebhookPayload = ${typeof data};\n`;
  }

  const rootName = customRootName || inferRootName(data);
  const collectedInterfaces: { name: string; body: string }[] = [];
  const generatedNames = new Set<string>();

  function getUniqueTypeName(base: string): string {
    let name = toPascalCase(base);
    if (!name || name === "Payload") name = "SubPayload";
    let candidate = name;
    let counter = 2;
    while (generatedNames.has(candidate)) {
      candidate = `${name}${counter++}`;
    }
    generatedNames.add(candidate);
    return candidate;
  }

  function resolveType(val: unknown, keyContext: string): string {
    if (val === null) return "null";
    if (val === undefined) return "undefined";

    const valType = typeof val;
    if (valType === "string") {
      // Check for ISO Date
      if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(val as string)) {
        return "string /* ISO Date */";
      }
      return "string";
    }
    if (valType === "number") return "number";
    if (valType === "boolean") return "boolean";

    if (Array.isArray(val)) {
      if (val.length === 0) return "unknown[]";
      // Sample first item or unify items
      const sample = val[0];
      const singularKey = toSingular(keyContext);
      const elemType = resolveType(sample, singularKey);
      return `${elemType}[]`;
    }

    if (valType === "object") {
      const typeName = getUniqueTypeName(keyContext);
      const fields: string[] = [];

      for (const [k, v] of Object.entries(val as Record<string, unknown>)) {
        const fieldType = resolveType(v, k);
        const ident = sanitizeIdentifier(k);
        const isOptional = v === undefined ? "?" : "";
        fields.push(`  ${ident}${isOptional}: ${fieldType};`);
      }

      const body = `export interface ${typeName} {\n${fields.join("\n")}\n}`;
      collectedInterfaces.push({ name: typeName, body });
      return typeName;
    }

    return "unknown";
  }

  // Generate for root
  const rootFields: string[] = [];
  if (Array.isArray(data)) {
    const itemType = resolveType(data[0] ?? {}, "Item");
    return `${collectedInterfaces.map((i) => i.body).join("\n\n")}\n\nexport type ${rootName} = ${itemType}[];\n`;
  }

  for (const [k, v] of Object.entries(data as Record<string, unknown>)) {
    const fieldType = resolveType(v, k);
    const ident = sanitizeIdentifier(k);
    rootFields.push(`  ${ident}: ${fieldType};`);
  }

  const rootInterface = `export interface ${rootName} {\n${rootFields.join("\n")}\n}`;

  // Put root at top, followed by sub-interfaces
  const allInterfaces = [
    rootInterface,
    ...collectedInterfaces.map((i) => i.body).reverse(),
  ];
  return allInterfaces.join("\n\n");
}

export function generateZodSchema(
  data: unknown,
  customRootName?: string
): string {
  if (data === null || data === undefined) {
    return `import { z } from "zod";\n\nexport const WebhookPayloadSchema = z.null();\nexport type WebhookPayload = z.infer<typeof WebhookPayloadSchema>;\n`;
  }

  const rootTypeName = customRootName || inferRootName(data);
  const rootSchemaName = `${rootTypeName.replace(/Payload$/, "")}Schema`;
  const collectedSchemas: { name: string; body: string }[] = [];
  const generatedNames = new Set<string>();

  function getUniqueSchemaName(base: string): string {
    let name = toPascalCase(base);
    if (!name) name = "Item";
    let candidate = `${name}Schema`;
    let counter = 2;
    while (generatedNames.has(candidate)) {
      candidate = `${name}${counter++}Schema`;
    }
    generatedNames.add(candidate);
    return candidate;
  }

  function resolveZod(val: unknown, keyContext: string): string {
    if (val === null) return "z.null()";
    if (val === undefined) return "z.undefined()";

    const valType = typeof val;
    if (valType === "string") {
      const s = val as string;
      if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s)) {
        return "z.string().email()";
      }
      if (/^https?:\/\//.test(s)) {
        return "z.string().url()";
      }
      if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(s)) {
        return "z.string().datetime()";
      }
      return "z.string()";
    }
    if (valType === "number") return "z.number()";
    if (valType === "boolean") return "z.boolean()";

    if (Array.isArray(val)) {
      if (val.length === 0) return "z.array(z.unknown())";
      const singularKey = toSingular(keyContext);
      const elem = resolveZod(val[0], singularKey);
      return `z.array(${elem})`;
    }

    if (valType === "object") {
      const schemaName = getUniqueSchemaName(keyContext);
      const fields: string[] = [];

      for (const [k, v] of Object.entries(val as Record<string, unknown>)) {
        const fieldZod = resolveZod(v, k);
        const ident = sanitizeIdentifier(k);
        fields.push(`  ${ident}: ${fieldZod},`);
      }

      const body = `export const ${schemaName} = z.object({\n${fields.join("\n")}\n});`;
      collectedSchemas.push({ name: schemaName, body });
      return schemaName;
    }

    return "z.unknown()";
  }

  if (Array.isArray(data)) {
    const itemZod = resolveZod(data[0] ?? {}, "Item");
    return [
      `import { z } from "zod";`,
      "",
      ...collectedSchemas.map((s) => s.body),
      `export const ${rootSchemaName} = z.array(${itemZod});`,
      `export type ${rootTypeName} = z.infer<typeof ${rootSchemaName}>;`,
    ].join("\n\n");
  }

  const rootFields: string[] = [];
  for (const [k, v] of Object.entries(data as Record<string, unknown>)) {
    const fieldZod = resolveZod(v, k);
    const ident = sanitizeIdentifier(k);
    rootFields.push(`  ${ident}: ${fieldZod},`);
  }

  const rootSchemaBody = `export const ${rootSchemaName} = z.object({\n${rootFields.join("\n")}\n});\n\nexport type ${rootTypeName} = z.infer<typeof ${rootSchemaName}>;`;

  return [
    `import { z } from "zod";`,
    "",
    ...collectedSchemas.reverse().map((s) => s.body),
    rootSchemaBody,
  ]
    .filter(Boolean)
    .join("\n\n");
}

export function generateNextRouteHandler(
  data: unknown,
  customRootName?: string
): string {
  const rootName = customRootName || inferRootName(data);
  const tsTypes = generateTypeScript(data, rootName);

  return `// app/api/webhooks/route.ts
import { NextResponse } from "next/server";

${tsTypes}

export async function POST(request: Request) {
  try {
    const payload: ${rootName} = await request.json();

    // Process typed webhook event
    console.log("Received webhook:", payload);

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Webhook processing error:", error);
    return NextResponse.json(
      { error: "Invalid payload or internal error" },
      { status: 400 }
    );
  }
}
`;
}

export function generateCurlSnippet(
  url: string,
  method = "POST",
  headers: Record<string, string> = {},
  body: unknown = null
): string {
  const parts: string[] = [`curl -X ${method.toUpperCase()} "${url}"`];

  const filteredHeaders = { ...headers };
  if (!filteredHeaders["content-type"] && body) {
    filteredHeaders["content-type"] = "application/json";
  }

  for (const [key, value] of Object.entries(filteredHeaders)) {
    parts.push(`  -H "${key}: ${value}"`);
  }

  if (body) {
    const bodyStr =
      typeof body === "string" ? body : JSON.stringify(body, null, 2);
    parts.push(`  -d '${bodyStr}'`);
  }

  return parts.join(" \\\n");
}
