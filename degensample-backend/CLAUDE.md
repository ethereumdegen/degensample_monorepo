# CLAUDE.md - Coding Assistant Guide

## Build Commands
- Rust: `cargo build`, `cargo run --bin webserver` (defi-relay-backend)
- Frontend: `yarn dev` (development), `yarn build-prod` (production)
- Contracts: `yarn compile`, `yarn deploy`

## Test Commands
- Rust: `cargo test` (all), `cargo test test_name` (single test)
- JS/TS: `yarn test`, `yarn test -g "test pattern"` (single test)

## Lint Commands
- Rust: `cargo fmt`, `cargo clippy`
- JS/TS: `yarn lint`

## Code Style
- Rust: snake_case for functions/variables, PascalCase for types
- JS/TS: camelCase for variables/functions, PascalCase for components/classes
- Error handling: Rust uses Result types with custom error enums; JS uses try/catch
- Imports: Group standard library, external crates/packages, then internal modules
- Types: Define domain types (DomainEthAddress), prefer strong typing over primitives

## Project Structure
- Module-based organization in Rust (mod.rs files)
- Domain-driven design with controllers, models, and domain types
- React components follow feature-based organization



### Code Pattern Guidelines 

Typically, dont include id or created_at in the model structs as POSTGRES manages these .   For getters in the models, the function should return SelectedRecord (type/selected_record.rs) which appends the id in that context.   

### Pagination Patterns

When implementing paginated endpoints:
1. Always use `PaginatedResponse::from_pagination_data()` helper method to create paginated responses
2. Avoid manual construction of pagination metadata (page, page_size, total_pages)
3. Return both items and total count from model methods that support pagination
4. Use the SQL Builder pattern for consistency in query construction