# TODO: Build more Products endpoints

## Plan (high level)
1. Decide endpoint list for the Products feature (inventory-friendly operations).
2. Add request validation (or reuse existing service validation patterns).
3. Extend ProductService + ProductRepository with the needed operations.
4. Add controller methods.
5. Add routes.
6. Ensure responses use existing `createSuccessResponse` and errors use `AppError`.
7. Run `npm run typecheck` and (if available) `npm test` / API tests.

## Proposed endpoints to add (suggested)
- `GET /api/v1/products/barcodes/:barcode` -> find product by barcode
- `GET /api/v1/products/categories` -> list categories + counts
- `GET /api/v1/products/low-stock?threshold=` -> products below threshold
- `POST /api/v1/products/:id/increase-stock` -> add stock
- `POST /api/v1/products/:id/decrease-stock` -> subtract stock (cannot go negative)
- `GET /api/v1/products?includeDeleted=true` (already supported in repository but not exposed via controller query)
- `PUT /api/v1/products/:id/restore` -> restore soft-deleted product

## Safety fixes needed before expanding endpoints
- Disallow `deletedAt` in update payload (block in `validateUpdatePayload` or sanitize it out).
- Optional: coerce numeric inputs for `price`/`stock` so validation is robust.

## Steps to implement
- [ ] Add/confirm desired endpoints.
- [ ] Implement controller/service/repo changes.
- [ ] Implement validation and response codes.
- [ ] Add routes.
- [ ] Typecheck.

