# Tenant Maintenance Triage

A Vellum plugin for property managers. It triages inbound tenant maintenance requests across a portfolio: classifies severity against habitability rules, routes the request to the correct vendor trade, checks for duplicate tickets and repeat-system patterns, and drafts both the vendor dispatch note and the tenant reply for human approval.

## What it does

- **Severity classification** across four tiers (emergency, urgent, routine, deferred) with the specific rule that drove the call.
- **Trade routing** to plumbing, HVAC, electrical, appliance, general maintenance, exterior, licensed pest control, or restoration, with a license-requirement flag.
- **Context checks** for open tickets on the same unit, tenant-supplied lease items, and repeat repairs on the same system.
- **Dual draft generation**: a vendor dispatch note and a tenant reply, both staged for the manager's one-click approval.

## Safety

The assistant only classifies, routes, and drafts. It never dispatches a vendor, never sends the tenant reply, and never authorizes an after-hours callout charge. Every action waits for human approval.

## Install

Install the plugin in Vellum and forward any tenant request to it. No configuration is required for the first triage.

## License

MIT
