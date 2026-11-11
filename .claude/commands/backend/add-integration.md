---
description: Add an external service integration using the Adapter pattern
argument-hint: "<service-name> <what it does> e.g. 'stripe payment processing'"
---

Integrate the service: $ARGUMENTS

1. Read `orchestra.config.json` and load `adapter` pattern skill.
2. Delegate to `backend-architect` to confirm: port interface design, injection token placement, error mapping strategy, and test approach. **Wait for approval.**
3. After approval:
   - Define the port interface in `domain/ports/`
   - Create the concrete adapter in `infrastructure/adapters/`
   - Add the injection token
   - Wire the adapter in the feature module
   - Create a mock implementation for testing
4. Delegate to `backend-verifier` to confirm type-check passes with no SDK types leaking through the port.
5. Report: port interface methods, adapter class, mock class, module wiring change.
