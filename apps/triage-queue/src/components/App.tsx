import { useState } from "preact/hooks";

type Severity = "emergency" | "urgent" | "routine" | "deferred";

interface Ticket {
  id: string;
  unit: string;
  property: string;
  tenant: string;
  received: string;
  afterHours: boolean;
  request: string;
  severity: Severity;
  severityReason: string;
  trade: string;
  licenseRequired: boolean;
  window: string;
  vendorNote: string;
  tenantReply: string;
  flags: string[];
  approved: boolean;
}

const SEVERITY_STYLE: Record<Severity, { bg: string; fg: string; border: string; label: string }> = {
  emergency: { bg: "#FDECEA", fg: "#B3261E", border: "rgba(179,38,30,0.25)", label: "Emergency" },
  urgent: { bg: "#FFF4E5", fg: "#B26A00", border: "rgba(178,106,0,0.25)", label: "Urgent" },
  routine: { bg: "#EEF4FF", fg: "#2A4C8F", border: "rgba(42,76,143,0.22)", label: "Routine" },
  deferred: { bg: "#F4F4F5", fg: "#5A6672", border: "rgba(0,0,0,0.10)", label: "Deferred" },
};

const SAMPLE_TICKETS: Ticket[] = [
  {
    id: "maint_482913",
    unit: "Unit 4B",
    property: "Cedar Ridge Apartments",
    tenant: "Dana Whitfield",
    received: "Today, 9:42 PM",
    afterHours: true,
    request: "Water is coming from under the kitchen sink and it is spreading across the floor fast. I put a bucket down but it is filling up.",
    severity: "emergency",
    severityReason: "Active water intrusion is damaging the unit and the units below it right now.",
    trade: "Plumbing",
    licenseRequired: true,
    window: "Same night callout, on-call vendor",
    vendorNote: "DISPATCH REQUEST - Plumbing (licensed)\nUnit: Unit 4B, Cedar Ridge Apartments\nReported: Today, 9:42 PM\nPriority: EMERGENCY - Same night callout, on-call vendor\n\nReported issue in the tenant's own words:\n\"Water is coming from under the kitchen sink and it is spreading across the floor fast.\"\n\nAccess: contact Dana Whitfield to confirm before arriving.",
    tenantReply: "Hi Dana, thanks for reporting this. We are treating it as an emergency and a plumbing vendor will be in touch today. If you can safely shut off the valve under the sink, please do so now.",
    flags: ["After-hours emergency: on-call rates apply and the manager must approve the callout spend.", "Plumbing work may require a licensed or permitted vendor in most jurisdictions."],
    approved: false,
  },
  {
    id: "maint_482890",
    unit: "Unit 12",
    property: "Cedar Ridge Apartments",
    tenant: "Marcus Bell",
    received: "Today, 4:15 PM",
    afterHours: false,
    request: "The refrigerator is not working at all. Everything inside is warm and I have groceries in there.",
    severity: "urgent",
    severityReason: "A failed major appliance in an occupied unit needs service on the next business day.",
    trade: "Appliance Repair",
    licenseRequired: false,
    window: "Next business day, morning window",
    vendorNote: "DISPATCH REQUEST - Appliance Repair\nUnit: Unit 12, Cedar Ridge Apartments\nReported: Today, 4:15 PM\nPriority: URGENT - Next business day, morning window\n\nReported issue in the tenant's own words:\n\"The refrigerator is not working at all. Everything inside is warm.\"",
    tenantReply: "Hi Marcus, thanks for letting us know. We have this queued for an appliance visit on the next business day and will confirm the exact window shortly.",
    flags: [],
    approved: false,
  },
  {
    id: "maint_482871",
    unit: "Unit 7C",
    property: "Harborview Lofts",
    tenant: "Priya Raman",
    received: "Today, 11:03 AM",
    afterHours: false,
    request: "The bathroom drain is draining really slowly. It still works, it just takes a while to empty.",
    severity: "routine",
    severityReason: "No habitability trigger and no active damage found in the request, so it schedules as a standard work order.",
    trade: "Plumbing",
    licenseRequired: true,
    window: "Next scheduled route day",
    vendorNote: "DISPATCH REQUEST - Plumbing (licensed)\nUnit: Unit 7C, Harborview Lofts\nReported: Today, 11:03 AM\nPriority: ROUTINE - Next scheduled route day",
    tenantReply: "Hi Priya, thanks for the note. We have logged this as a standard work order and it will be scheduled on the next route day.",
    flags: ["Duplicate ticket risk: 1 open ticket(s) already on this unit. Confirm before dispatching."],
    approved: false,
  },
  {
    id: "maint_482855",
    unit: "Unit 2A",
    property: "Harborview Lofts",
    tenant: "Tom Okafor",
    received: "Yesterday, 6:20 PM",
    afterHours: false,
    request: "The light bulb in the hallway burned out and the AC filter probably needs changing too.",
    severity: "deferred",
    severityReason: "Bulbs, filters, and batteries are commonly tenant-supplied items under the lease.",
    trade: "General Maintenance",
    licenseRequired: false,
    window: "No dispatch, route to leasing or billing",
    vendorNote: "No vendor dispatch. Route to leasing or billing for a tenant-supplied item review.",
    tenantReply: "Hi Tom, thanks for reaching out. This one is not a maintenance work order, so we are passing it to the property manager to review with you directly.",
    flags: ["Possible tenant-chargeable item. Route to the manager for a billing decision, not a vendor."],
    approved: false,
  },
];

export function App() {
  const [tickets, setTickets] = useState<Ticket[]>(SAMPLE_TICKETS);
  const [selectedId, setSelectedId] = useState<string>(SAMPLE_TICKETS[0].id);

  const ticket = tickets.find((t) => t.id === selectedId) || tickets[0];
  const style = SEVERITY_STYLE[ticket.severity];

  const approve = () => {
    setTickets((prev) => prev.map((t) => (t.id === ticket.id ? { ...t, approved: true } : t)));
  };

  const counts = {
    emergency: tickets.filter((t) => t.severity === "emergency").length,
    urgent: tickets.filter((t) => t.severity === "urgent").length,
    routine: tickets.filter((t) => t.severity === "routine").length,
    deferred: tickets.filter((t) => t.severity === "deferred").length,
  };

  return (
    <div style={{ maxWidth: "980px", margin: "24px auto", padding: "0 20px", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "18px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{ width: "42px", height: "42px", borderRadius: "10px", background: "#EBF5EC", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "22px" }}>
            🏢
          </div>
          <div>
            <h1 style={{ fontFamily: "Georgia, serif", fontSize: "22px", margin: 0, fontWeight: 400, color: "#191816" }}>Tenant Maintenance Triage</h1>
            <p style={{ margin: "2px 0 0", fontSize: "13px", color: "#666" }}>Severity, trade routing, and both drafts staged for your approval</p>
          </div>
        </div>
        <div style={{ display: "flex", gap: "8px" }}>
          {(["emergency", "urgent", "routine", "deferred"] as Severity[]).map((s) => (
            <div key={s} style={{ background: SEVERITY_STYLE[s].bg, color: SEVERITY_STYLE[s].fg, border: `1px solid ${SEVERITY_STYLE[s].border}`, borderRadius: "8px", padding: "6px 10px", minWidth: "62px", textAlign: "center" }}>
              <div style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em" }}>{SEVERITY_STYLE[s].label}</div>
              <div style={{ fontSize: "16px", fontWeight: 700, marginTop: "1px" }}>{counts[s]}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "300px 1fr", gap: "16px" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {tickets.map((t) => {
            const s = SEVERITY_STYLE[t.severity];
            const active = t.id === selectedId;
            return (
              <button
                key={t.id}
                onClick={() => setSelectedId(t.id)}
                style={{
                  textAlign: "left",
                  padding: "12px 14px",
                  borderRadius: "10px",
                  border: active ? "1.5px solid #4C9B50" : "1px solid rgba(0,0,0,0.08)",
                  background: active ? "#F4FBF5" : "#FAFAF9",
                  cursor: "pointer",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: "13px", fontWeight: 700, color: "#191816" }}>{t.unit}</span>
                  <span style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase", color: s.fg, background: s.bg, borderRadius: "10px", padding: "2px 7px" }}>{s.label}</span>
                </div>
                <div style={{ fontSize: "11px", color: "#888", marginTop: "3px" }}>{t.property} · {t.received}{t.afterHours ? " · after hours" : ""}</div>
                <div style={{ fontSize: "12px", color: "#555", marginTop: "6px", lineHeight: 1.45 }}>
                  {t.request.length > 74 ? t.request.slice(0, 74) + "..." : t.request}
                </div>
              </button>
            );
          })}
        </div>

        <div style={{ border: "1px solid rgba(0,0,0,0.08)", borderRadius: "12px", background: "#FFFFFF", overflow: "hidden" }}>
          <div style={{ padding: "16px 20px", borderBottom: "1px solid rgba(0,0,0,0.07)", background: "#FAFAF9" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <span style={{ fontSize: "15px", fontWeight: 700, color: "#191816" }}>{ticket.unit} · {ticket.property}</span>
                <span style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase", color: style.fg, background: style.bg, border: `1px solid ${style.border}`, borderRadius: "10px", padding: "3px 9px" }}>{style.label}</span>
              </div>
              <span style={{ fontSize: "12px", color: "#888" }}>{ticket.received}</span>
            </div>
            <div style={{ fontSize: "12px", color: "#5A6672", marginTop: "8px", lineHeight: 1.55 }}>{ticket.severityReason}</div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "10px", padding: "14px 20px", borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
            <div style={{ background: "#FAFAF9", borderRadius: "8px", padding: "10px 12px" }}>
              <div style={{ fontSize: "10px", color: "#888", textTransform: "uppercase", fontWeight: 700 }}>Trade</div>
              <div style={{ fontSize: "14px", fontWeight: 700, color: "#191816", marginTop: "2px" }}>{ticket.trade}</div>
            </div>
            <div style={{ background: "#FAFAF9", borderRadius: "8px", padding: "10px 12px" }}>
              <div style={{ fontSize: "10px", color: "#888", textTransform: "uppercase", fontWeight: 700 }}>License</div>
              <div style={{ fontSize: "14px", fontWeight: 700, color: ticket.licenseRequired ? "#B26A00" : "#2E7D32", marginTop: "2px" }}>{ticket.licenseRequired ? "Likely required" : "Not required"}</div>
            </div>
            <div style={{ background: "#FAFAF9", borderRadius: "8px", padding: "10px 12px" }}>
              <div style={{ fontSize: "10px", color: "#888", textTransform: "uppercase", fontWeight: 700 }}>Dispatch Window</div>
              <div style={{ fontSize: "13px", fontWeight: 700, color: "#191816", marginTop: "2px" }}>{ticket.window}</div>
            </div>
          </div>

          {ticket.flags.length > 0 && (
            <div style={{ padding: "12px 20px", borderBottom: "1px solid rgba(0,0,0,0.06)", background: "#FFFBF2" }}>
              {ticket.flags.map((f, i) => (
                <div key={i} style={{ fontSize: "12px", color: "#7A5300", lineHeight: 1.5 }}>⚠ {f}</div>
              ))}
            </div>
          )}

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0" }}>
            <div style={{ padding: "16px 20px", borderRight: "1px solid rgba(0,0,0,0.06)" }}>
              <div style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", color: "#5A6672", letterSpacing: "0.05em", marginBottom: "8px" }}>Vendor Dispatch Note (draft)</div>
              <pre style={{ whiteSpace: "pre-wrap", fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace", fontSize: "11.5px", lineHeight: 1.6, color: "#374151", background: "#FAFAF9", border: "1px solid rgba(0,0,0,0.06)", borderRadius: "8px", padding: "12px", margin: 0 }}>{ticket.vendorNote}</pre>
            </div>
            <div style={{ padding: "16px 20px" }}>
              <div style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", color: "#5A6672", letterSpacing: "0.05em", marginBottom: "8px" }}>Tenant Reply (draft)</div>
              <div style={{ fontSize: "13px", lineHeight: 1.65, color: "#374151", background: "#FAFAF9", border: "1px solid rgba(0,0,0,0.06)", borderRadius: "8px", padding: "12px" }}>{ticket.tenantReply}</div>
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#F6F5F4", padding: "14px 20px" }}>
            <div style={{ fontSize: "12px", color: "#666" }}>
              <strong>Nothing dispatches on its own.</strong> Approving stages the dispatch note and the tenant reply for sending.
            </div>
            <button
              onClick={approve}
              disabled={ticket.approved}
              style={{
                background: ticket.approved ? "#81C784" : "#4C9B50",
                color: "#FFFFFF",
                border: "none",
                padding: "10px 22px",
                borderRadius: "999px",
                fontSize: "13px",
                fontWeight: 700,
                cursor: ticket.approved ? "default" : "pointer",
                boxShadow: "0 2px 6px rgba(76,155,80,0.3)",
              }}
            >
              {ticket.approved ? "✓ Approved & Staged" : "Approve & Stage Dispatch"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
