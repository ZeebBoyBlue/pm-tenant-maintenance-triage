---
name: "pm-tenant-maintenance-triage"
description: "Triages inbound tenant maintenance requests for property managers: classifies urgency, routes to the correct vendor trade, checks unit and lease context, and drafts both the vendor dispatch note and the tenant reply for human approval."
metadata:
  emoji: "\U0001F3E2"
  vellum:
    display-name: "Tenant Maintenance Triage"
    activation-hints:
      - "triage tenant maintenance request"
      - "tenant says the heat is out"
      - "route maintenance request to vendor"
      - "buildium maintenance ticket"
      - "after hours maintenance call"
    avoid-when:
      - "estimating contractor repair quotes"
      - "reconciling accounting transactions"
    category: real-estate
---

# Tenant Maintenance Triage

Triages inbound tenant maintenance requests across a property manager's whole door count. Classifies severity, decides whether the request is an emergency that needs a same-day dispatch or a routine work order, routes it to the correct vendor trade, and drafts the vendor dispatch note and the tenant reply so the manager only has to approve, not compose.

## Trigger & Input
Triggered when a tenant submits a maintenance request by phone note, text, email, or Buildium tenant portal message:
- Raw request text or call transcript ("water coming from under the sink, it is spreading")
- Unit address or unit number and property name
- Tenant name and best contact number
- Time the request came in (for after-hours rules)
- Optional asset context: appliance age, HVAC unit, prior tickets on the unit

## Execution Workflow

### 1. Severity Classification
Separates every request into one of four tiers using habitability and property-damage rules:
- **Emergency (same-day dispatch):** no heat below the local cold threshold, no water, active flooding or sewage backup, gas smell, no power to the unit, lock or door failure, no working toilet in a one-bath unit.
- **Urgent (next business day):** partial loss of a system, a leak that is contained but worsening, refrigerator or oven failure in an occupied unit.
- **Routine (scheduled):** cosmetic damage, a slow drain, a fixture that still functions, pest sightings that are not an infestation.
- **Deferred / Not a Maintenance Issue:** tenant-caused damage, a request that is a lease or neighbor dispute, or a request already covered by an open ticket.

### 2. Trade Routing
Maps the request to the correct vendor trade and the license or permit the job likely needs:
- **Plumbing:** supply leaks, drains, water heaters, shutoff valves, sewage backup.
- **HVAC:** heat, cooling, refrigerant, thermostat, filter service.
- **Electrical:** outlets, breakers, fixtures, panel work.
- **Appliance:** refrigerator, oven, dishwasher, washer and dryer.
- **General / Handyman:** doors, locks, drywall, paint, caulk, weather sealing.
- **Exterior / Grounds:** roof, gutters, siding, landscaping, snow and ice.
- **Pest Control:** licensed applicator required.
- **Restoration:** active water intrusion, mold, fire or smoke damage.

### 3. Context Check
Before drafting anything, the assistant checks what it already knows:
- Whether an open ticket already covers this issue, to avoid a duplicate dispatch.
- Whether the unit lease puts the item on the tenant, for example tenant-supplied filters or light bulbs.
- Whether the property has a documented vendor for that trade, and whether that vendor is already out on another unit.
- Whether this is the third ticket on the same system in a short window, which flags the system for replacement rather than another repair.

### 4. Draft Dispatch Note and Tenant Reply
Produces two artifacts, both staged as drafts:
- **Vendor dispatch note:** unit address, access instructions, the tenant's own words about the symptom, severity tier, and the time window requested.
- **Tenant reply:** what happens next, the expected window, the access instructions the vendor needs, and what the tenant should do in the meantime, for example shut the supply valve, when that is safe.

### 5. Human-in-the-Loop Safety Gate
The assistant only classifies, routes, and drafts. It never dispatches a vendor, never sends the tenant reply, and never authorizes a spend or an emergency after-hours callout charge. Every draft waits for the manager's one-click approval.

## Output
- Severity tier with the specific habitability rule that drove it.
- Recommended trade plus any license or permit requirement.
- Vendor dispatch note draft.
- Tenant reply draft.
- Flag list: duplicate ticket risk, tenant-chargeable item, repeat-system pattern.
