# AGENTS.md

## Project context

This is an MVP ecommerce platform for Argentina.
It sells physical products such as electronics, home gadgets, and accessories.
The system uses:

- frontend: Next.js
- backend: NestJS
- database: PostgreSQL
- payments: Mercado Pago Checkout Pro
- image storage: Cloudinary

## Architecture rules

- Keep frontend and backend separated
- Do not place business logic in controllers
- Use service layer and modules in backend
- Use DTOs and validation for all write endpoints
- Use TypeScript strict mode
- Keep the MVP simple and evolvable

## Domain rules

- Products must support variants
- Inventory is tracked per variant
- Orders become immutable after payment confirmation
- Mercado Pago webhooks must be idempotent
- Product images are stored externally and only URLs are persisted

## Quality rules

- Prefer clear code over clever code
- Add tests for critical payment and order flows
- Use structured logging
- Avoid premature complexity
