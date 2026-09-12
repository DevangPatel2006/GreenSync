# Architecture Decision Records (ADRs)

This file tracks architectural decisions for GreenSync.

---

## ADR 001: Centralized API Client in Frontend

- **Status**: Accepted
- **Context**: Multiple components making disparate `axios` calls lead to duplicated headers, fragmented base URLs, and scattered error handling.
- **Decision**: All HTTP calls must flow through `frontend/src/services/api.js`. Direct imports of `axios` elsewhere in `frontend/src/` are prohibited.
- **Consequences**: Consistent authentication header injection, centralized error handling, and ease of mocking in unit tests.

---

## ADR 002: Thin Controllers and Domain Services in Backend

- **Status**: Accepted
- **Context**: Business logic placed in controllers makes testing difficult and tightly couples HTTP transport logic with domain logic.
- **Decision**: Controllers must remain thin, delegating business logic immediately to domain services (`services/scheduling`, `services/energy`, `services/rewards`).
- **Consequences**: Easy unit testing of services, reusable logic across HTTP/worker tasks, clean separation of concerns.

---

## ADR 003: Provider Pattern for Energy Data Providers

- **Status**: Accepted
- **Context**: Multiple third-party energy grid providers and IoT smart meter vendors exist with diverse APIs.
- **Decision**: Define a common `EnergyDataProvider` interface in `backend/src/providers/` and implement concrete adapters per provider.
- **Consequences**: Decouples GreenSync core logic from external API quirks and enables swapping or adding energy providers seamlessly.
