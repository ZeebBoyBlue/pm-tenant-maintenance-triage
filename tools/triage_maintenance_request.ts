import type { ToolContext, ToolExecutionResult } from "@vellumai/plugin-api";

export type Severity = "emergency" | "urgent" | "routine" | "deferred";

export type Trade =
  | "plumbing"
  | "hvac"
  | "electrical"
  | "appliance"
  | "general"
  | "exterior"
  | "pest_control"
  | "restoration";

export interface TriageResult {
  request_id: string;
  unit: string;
  tenant_name: string;
  received_at: string;
  severity: Severity;
  severity_reason: string;
  trade: Trade;
  trade_label: string;
  license_required: boolean;
  dispatch_window: string;
  after_hours: boolean;
  vendor_dispatch_note: string;
  tenant_reply: string;
  flags: string[];
  human_approval_required: true;
}

const TRADE_LABELS: Record<Trade, string> = {
  plumbing: "Plumbing",
  hvac: "HVAC",
  electrical: "Electrical",
  appliance: "Appliance Repair",
  general: "General Maintenance",
  exterior: "Exterior & Grounds",
  pest_control: "Licensed Pest Control",
  restoration: "Water & Fire Restoration",
};

const LICENSE_TRADES: Trade[] = ["plumbing", "hvac", "electrical", "pest_control", "restoration"];

// Keyword maps drive the deterministic classification. Order matters: the
// first map that matches sets the trade, and severity is scored separately.
const TRADE_KEYWORDS: Array<{ trade: Trade; words: string[] }> = [
  { trade: "restoration", words: ["sewage", "sewer backup", "mold", "mould", "fire damage", "smoke damage", "ceiling collapse", "flooded"] },
  { trade: "plumbing", words: ["leak", "leaking", "water heater", "no hot water", "drain", "clog", "toilet", "faucet", "sink", "shutoff", "pipe", "burst"] },
  { trade: "hvac", words: ["heat", "heater", "furnace", "ac ", "air conditioning", "air conditioner", "cooling", "thermostat", "hvac", "refrigerant", "filter"] },
  { trade: "electrical", words: ["outlet", "breaker", "electrical", "power", "lights", "light fixture", "sparks", "sparking", "gfci", "panel"] },
  { trade: "appliance", words: ["refrigerator", "fridge", "oven", "stove", "dishwasher", "washer", "dryer", "microwave", "garbage disposal"] },
  { trade: "pest_control", words: ["roach", "cockroach", "bed bug", "bedbug", "rodent", "mice", "mouse", "rats", "ants", "wasp", "hornet", "infestation"] },
  { trade: "exterior", words: ["roof", "gutter", "siding", "fence", "driveway", "landscap", "snow", "ice dam", "tree limb"] },
  { trade: "general", words: ["door", "lock", "window", "drywall", "wall", "paint", "caulk", "cabinet", "handle", "hinge", "screen"] },
];

const EMERGENCY_PATTERNS: Array<{ re: RegExp; reason: string }> = [
  { re: /gas\s*(smell|leak|odor|odour)/i, reason: "Gas smell reported in the unit, which is an immediate life-safety hazard." },
  { re: /(sewage|sewer)\s*(backup|backed up|overflow)/i, reason: "Sewage backup is a health hazard and can escalate into a restoration job." },
  { re: /(actively\s*)?flood|water\s*(coming|pouring|gushing|spreading)|burst\s*pipe/i, reason: "Active water intrusion is damaging the unit and the units below it right now." },
  { re: /no\s*(heat|hot water)|heat\s*(is\s*)?(out|not working|off)/i, reason: "Loss of heat below the local cold threshold breaks the warranty of habitability." },
  { re: /no\s*(power|electricity)|power\s*(is\s*)?(out|off)/i, reason: "Full loss of power makes the unit uninhabitable." },
  { re: /(locked out|cannot (lock|secure)|door (will not|wont|won.t) (lock|close)|broken lock)/i, reason: "A unit that cannot be secured is a safety and liability exposure." },
  { re: /no\s*(working\s*)?toilet|toilet\s*(is\s*)?(overflow|backed)/i, reason: "A non-functioning toilet in a single-bath unit is a habitability failure." },
  { re: /smell(s)?\s*(like\s*)?(burn|smoke)|sparking|sparks/i, reason: "Burning smell or sparking points to an electrical fault with fire risk." },
];

const URGENT_PATTERNS: Array<{ re: RegExp; reason: string }> = [
  { re: /(refrigerator|fridge|oven|stove)\s*(is\s*)?(not working|dead|broke)/i, reason: "A failed major appliance in an occupied unit needs service on the next business day." },
  { re: /slow\s*(drain|leak)|dripping|drip|small leak|contained leak/i, reason: "A contained but worsening leak needs the next business-day slot before it spreads." },
  { re: /(partial|some)\s*(power|heat|cooling)|(one|two)\s*(outlet|room)s?\s*(is|are)?\s*(dead|out)/i, reason: "Partial loss of a system degrades the unit but does not make it uninhabitable today." },
  { re: /(water heater|furnace|boiler)\s*(is\s*)?(making|making a)\s*(noise|banging)/i, reason: "Equipment distress on a water heater or boiler often precedes a full failure." },
];

const DEFERRED_PATTERNS: Array<{ re: RegExp; reason: string }> = [
  { re: /(my\s*)?neighbor|noise complaint|parking|pet\s*(policy|deposit)|lease\s*(question|term)/i, reason: "This is a lease or neighbor matter, not a maintenance work order." },
  { re: /(i|we)\s*(broke|damaged|caused|spilled)|my\s*(fault|doing)/i, reason: "The tenant indicates the damage is tenant-caused, so it is a chargeable item rather than a standard work order." },
  { re: /light\s*bulb|filter\s*(change|replacement)|battery/i, reason: "Bulbs, filters, and batteries are commonly tenant-supplied items under the lease." },
];

function pickTrade(text: string): Trade {
  const lower = text.toLowerCase();
  for (const entry of TRADE_KEYWORDS) {
    if (entry.words.some((w) => lower.includes(w))) return entry.trade;
  }
  return "general";
}

function classify(text: string): { severity: Severity; reason: string } {
  for (const p of EMERGENCY_PATTERNS) {
    if (p.re.test(text)) return { severity: "emergency", reason: p.reason };
  }
  for (const p of DEFERRED_PATTERNS) {
    if (p.re.test(text)) return { severity: "deferred", reason: p.reason };
  }
  for (const p of URGENT_PATTERNS) {
    if (p.re.test(text)) return { severity: "urgent", reason: p.reason };
  }
  return { severity: "routine", reason: "No habitability trigger and no active damage found in the request, so it schedules as a standard work order." };
}

function dispatchWindow(severity: Severity, afterHours: boolean): string {
  if (severity === "emergency") {
    return afterHours ? "Same night callout, on-call vendor" : "Same-day dispatch, within 4 hours";
  }
  if (severity === "urgent") return "Next business day, morning window";
  if (severity === "routine") return "Next scheduled route day";
  return "No dispatch, route to leasing or billing";
}

export default {
  name: "triage_maintenance_request",
  description: "Classifies an inbound tenant maintenance request by severity, routes it to the correct vendor trade, and drafts the vendor dispatch note and tenant reply for human approval.",
  defaultRiskLevel: "low" as const,
  input_schema: {
    type: "object",
    properties: {
      request_text: {
        type: "string",
        description: "The tenant's raw maintenance request, message, or call transcript.",
      },
      unit: {
        type: "string",
        description: "Unit number or full address of the property.",
      },
      tenant_name: {
        type: "string",
        description: "Tenant name for the dispatch note and reply.",
      },
      received_at: {
        type: "string",
        description: "When the request came in, ISO timestamp or local time.",
      },
      after_hours: {
        type: "boolean",
        description: "Whether the request arrived outside business hours.",
      },
      open_tickets: {
        type: "array",
        items: { type: "string" },
        description: "Short descriptions of any open tickets already on this unit.",
      },
    },
    required: ["request_text"],
  },
  async execute(input: Record<string, unknown>, _ctx: ToolContext): Promise<ToolExecutionResult> {
    const requestText = String(input.request_text ?? "");
    const unit = String(input.unit ?? "Unit not provided");
    const tenantName = String(input.tenant_name ?? "Tenant");
    const receivedAt = String(input.received_at ?? new Date().toISOString());
    const afterHours = Boolean(input.after_hours ?? false);
    const openTickets = Array.isArray(input.open_tickets) ? (input.open_tickets as string[]) : [];

    const { severity, reason } = classify(requestText);
    const trade = pickTrade(requestText);
    const licenseRequired = LICENSE_TRADES.includes(trade);
    const window = dispatchWindow(severity, afterHours);

    const flags: string[] = [];
    if (openTickets.length > 0) {
      flags.push(`Duplicate ticket risk: ${openTickets.length} open ticket(s) already on this unit. Confirm before dispatching.`);
    }
    if (severity === "deferred") {
      flags.push("Possible tenant-chargeable item. Route to the manager for a billing decision, not a vendor.");
    }
    if (licenseRequired) {
      flags.push(`${TRADE_LABELS[trade]} work may require a licensed or permitted vendor in most jurisdictions.`);
    }
    if (afterHours && severity === "emergency") {
      flags.push("After-hours emergency: on-call rates apply and the manager must approve the callout spend.");
    }

    const vendorNote = [
      `DISPATCH REQUEST - ${TRADE_LABELS[trade]}${licenseRequired ? " (licensed)" : ""}`,
      `Unit: ${unit}`,
      `Reported: ${receivedAt}`,
      `Priority: ${severity.toUpperCase()} - ${window}`,
      "",
      "Reported issue in the tenant's own words:",
      `"${requestText.trim()}"`,
      "",
      `Access: contact ${tenantName} to confirm the window before arriving.`,
      openTickets.length > 0 ? `Note: open ticket(s) already on file - ${openTickets.join("; ")}` : "",
    ].filter(Boolean).join("\n");

    const replyBySeverity: Record<Severity, string> = {
      emergency: `Hi ${tenantName}, thanks for reporting this. We are treating it as an emergency and a ${TRADE_LABELS[trade].toLowerCase()} vendor will be in touch today. If you can safely shut off the water or the breaker for the affected area, please do so now.`,
      urgent: `Hi ${tenantName}, thanks for letting us know. We have this queued for a ${TRADE_LABELS[trade].toLowerCase()} visit on the next business day and will confirm the exact window shortly.`,
      routine: `Hi ${tenantName}, thanks for the note. We have logged this as a standard work order and it will be scheduled on the next route day. We will let you know the date as soon as it is set.`,
      deferred: `Hi ${tenantName}, thanks for reaching out. This one is not a maintenance work order, so we are passing it to the property manager to review with you directly.`,
    };

    const result: TriageResult = {
      request_id: `maint_${Date.now().toString().slice(-6)}`,
      unit,
      tenant_name: tenantName,
      received_at: receivedAt,
      severity,
      severity_reason: reason,
      trade,
      trade_label: TRADE_LABELS[trade],
      license_required: licenseRequired,
      dispatch_window: window,
      after_hours: afterHours,
      vendor_dispatch_note: vendorNote,
      tenant_reply: replyBySeverity[severity],
      flags,
      human_approval_required: true,
    };

    return {
      success: true,
      data: result,
      display: {
        type: "card",
        title: `Maintenance Triage (${unit})`,
        subtitle: `${severity.toUpperCase()} - ${TRADE_LABELS[trade]} - ${window}`,
        data: result,
      },
    };
  },
};
