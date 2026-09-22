# Infrastructure Incident Runbook

This runbook is a portfolio learning artifact and does not authorize production changes.

## Detect
Record the affected node, service role, state, CPU, memory, backup age, DNS target, TCP port, and timestamp.

## Confirm impact
Determine whether the issue affects one node, one service role, one zone, or dependent services.

## Preserve evidence
Capture health output and relevant logs before making a recovery change when possible.

## Escalate
Escalate if no healthy redundant node exists, backup verification fails, a critical service remains unavailable, a security event is suspected, or the required action is outside operator authorization.

## Recover
Use an approved recovery procedure. The repository failover workflow is simulation only.

## Verify
Run the health scan again, confirm redundancy, verify dependent service paths, and verify backup integrity when relevant.

## Document
Record symptoms, impact, evidence, recovery action, result, suspected root cause, and follow-up controls.
