import { to15, to18 } from "@/lib/id-converter";

export interface ExtractedIdGroup {
  label: string;
  ids: string[];
}

const SALESFORCE_PREFIXES: Record<string, string> = {
  "001": "Account",
  "003": "Contact",
  "005": "User",
  "006": "Opportunity",
  "00D": "Organization",
  "00G": "Group",
  "00P": "Attachment",
  "00Q": "Lead",
  "00T": "Task",
  "00U": "Event",
  "500": "Case",
  "701": "Campaign",
  "800": "Contract",
};

function isValidSalesforceId(id: string): boolean {
  return /^[a-zA-Z0-9]{15,18}$/.test(id);
}

function isValid18CharacterId(id: string): boolean {
  if (id.length !== 18 || !isValidSalesforceId(id)) {
    return false;
  }

  try {
    return to18(to15(id)) === id;
  } catch {
    return false;
  }
}

function isValidSalesforceIdToken(token: string): boolean {
  if (token.length === 15) {
    return isValidSalesforceId(token);
  }

  if (token.length === 18) {
    return isValid18CharacterId(token);
  }

  return false;
}

export function extractSalesforceIds(text: string): string[] {
  const seen = new Set<string>();
  const extracted: string[] = [];

  const tokens = text.match(/[a-zA-Z0-9]+/g) ?? [];
  for (const token of tokens) {
    if (!isValidSalesforceIdToken(token) || seen.has(token)) {
      continue;
    }

    seen.add(token);
    extracted.push(token);
  }

  return extracted;
}

export function convertExtractedIdsTo18(ids: string[]): string[] {
  return ids.map((id) => {
    if (id.length === 18) {
      return id;
    }

    if (id.length === 15) {
      return to18(id);
    }

    return id;
  });
}

export function getSalesforceObjectName(id: string): string {
  const prefix = id.slice(0, 3);
  return SALESFORCE_PREFIXES[prefix] ?? "Unknown";
}

export function groupSalesforceIdsByObject(ids: string[]): ExtractedIdGroup[] {
  const groups = new Map<string, string[]>();
  const order: string[] = [];

  for (const id of ids) {
    const label = getSalesforceObjectName(id);
    if (!groups.has(label)) {
      groups.set(label, []);
      order.push(label);
    }

    groups.get(label)!.push(id);
  }

  return order.map((label) => ({ label, ids: groups.get(label) ?? [] }));
}

export function formatExtractedIds(ids: string[], groupByObject: boolean): string {
  if (ids.length === 0) {
    return "";
  }

  if (!groupByObject) {
    return ids.join("\n");
  }

  return groupSalesforceIdsByObject(ids)
    .map(
      (group) =>
        `${group.label} (${group.ids.length})\n------\n${group.ids.join("\n")}`
    )
    .join("\n\n");
}
