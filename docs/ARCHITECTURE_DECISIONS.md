# Architecture Decisions

This document records significant technical and architectural decisions made for the jrnl-mcp project.

---

## ADR-001: Phase 1 Completion and Branch Strategy

**Date**: 2026-02-01
**Status**: Accepted

### Context

After releasing jrnl-mcp v1.0.0, we implemented Phase 1 improvements for code quality. Upon completion, we needed to decide on development and release strategies going forward.

### Decisions

#### 1. Phase 1 Completed Items

| Category | Details |
|----------|---------|
| Dependency Updates | MCP SDK 1.25.3, TypeScript 5.9.3, removed unused date-fns |
| Error Handling | Custom error classes, unified Logger |
| Test Improvements | 26 → 50 tests, error cases, fixtures |
| Type Safety | Eliminated all `any` types, created type definitions |

#### 2. Items Deferred to Phase 2

| Item | Reason for Deferral |
|------|---------------------|
| Jest 30 | jsdom changes, API changes require impact analysis |
| ESLint 9 | Requires Flat Config migration, significant config rewrite |
| Documentation | More efficient to write after code stabilizes |

#### 3. Branch Strategy

```
main     ← Release version (stable, tagged releases)
  └── develop ← Development version (daily development)
```

- **main**: Release branch. Only tagged versions.
- **develop**: Development branch. All development happens here.
- **GitHub default branch**: Remains `main`

**Rationale**:
- Visitors see stable version (README, docs)
- PR default target is stable branch
- Follows common Git Flow conventions

#### 4. Release Strategy

**Keep current approach**:
```
develop → main (PR/merge) → Create GitHub Release (manual) → npm publish (auto)
```

**Rationale**:
- Existing CI config (publish.yml) works
- Manual release is sufficient for current frequency
- Allows control over release timing

May consider semantic-release automation if frequency increases.

#### 5. CI Configuration Fix

Changed `test:all` to run all tests:
```json
// Before
"test:all": "npm run test:unit && npm run test:integration"

// After
"test:all": "jest"
```

**Rationale**:
- New `error-cases.test.ts` was not running in CI
- Future test files will automatically be included

### Consequences

- Developers work on `develop` branch
- Create PR from `develop` → `main` for releases
- After merge, manually create GitHub Release to trigger npm publish

---

## ADR-002: Caching Feature Rejected

**Date**: 2026-02-02
**Status**: Rejected

### Context

The original Phase 2 roadmap included a caching feature to improve performance for large journals. The proposed feature included:

- TTL-based automatic cache invalidation
- Memory usage limits
- Caching for tag lists, statistics, and optionally search results
- Manual cache clearing functionality

### Decision

**Reject the caching feature implementation.**

### Rationale

1. **Low data volume**: Personal journals rarely grow large enough to cause performance issues. Even journals with thousands of entries can be processed quickly by the jrnl CLI.

2. **Low frequency of access**: MCP sessions are typically short-lived, and the same data is rarely requested multiple times within a session.

3. **Minimal performance benefit**: The overhead of implementing and maintaining cache invalidation logic outweighs the marginal performance gains.

4. **Data freshness concerns**: Journals are frequently updated. Caching introduces complexity around invalidation timing and stale data risks.

5. **Session lifecycle**: MCP servers often restart between conversations, which would clear any in-memory cache anyway.

### Consequences

- Remove caching from Phase 2 roadmap
- Simplify codebase by avoiding unnecessary complexity
- Focus development effort on higher-value features (ESModules migration, documentation)
- If performance issues arise in the future, this decision can be revisited with concrete evidence

---

## ADR-003: ESModules Migration Rejected

**Date**: 2026-02-02
**Status**: Rejected

### Context

The original Phase 2 roadmap included migrating from CommonJS to ESModules. The proposed changes included:

- Changing `tsconfig.json` to use `module: "ESNext"`
- Adding `"type": "module"` to `package.json`
- Updating all import/export statements
- Verifying build process and test compatibility

### Decision

**Reject the ESModules migration.**

### Rationale

1. **No practical benefit for this project**:
   - Tree-shaking requires a bundler; this project runs directly on Node.js
   - Top-level await is not currently needed
   - TypeScript already provides modern development experience

2. **MCP SDK is dual-package**: The SDK provides both ESM and CJS entry points. Current CJS usage works without issues.

3. **Migration cost outweighs benefits**:
   - All imports would need `.js` extension added
   - Jest configuration becomes more complex with ESM
   - Risk of compatibility issues with some tools

4. **CommonJS remains well-supported**: Node.js will continue supporting CommonJS for the foreseeable future.

5. **Current state works perfectly**: All 50 tests pass, build succeeds, no runtime issues.

### Consequences

- Remove ESModules migration from Phase 2 roadmap
- Keep using CommonJS (`module: "CommonJS"` in tsconfig.json)
- Avoid unnecessary complexity and migration risk
- If a compelling reason arises (e.g., dependency requiring ESM-only), this decision can be revisited

---

## ADR-004: Documentation and Developer Experience Tasks Deferred

**Date**: 2026-02-02
**Status**: Deferred

### Context

Phase 2 roadmap included documentation expansion and developer experience improvements:

**Documentation:**
- Troubleshooting guide
- Usage examples collection
- Contributing guidelines

**Developer Experience:**
- Debug mode implementation
- CLI test tool creation
- Hot reload functionality

### Decision

**Defer these tasks indefinitely.**

"Deferred" means:
- Not starting now
- Not abandoned (may be revisited)
- No planned timeline

### Rationale

1. **Low immediate value**: The project works correctly; additional documentation provides marginal benefit
2. **Personal project**: Low external contributor activity (1 PR in 7 months)
3. **Existing coverage**: README provides basic usage; 50 tests ensure quality
4. **Maintenance cost**: Documentation becomes stale; better to write when actually needed
5. **Developer tools exist**: Logger already implemented; `npm run dev` sufficient for development

### What Was Completed

- Architecture documentation (`docs/ARCHITECTURE.md`) with Mermaid diagrams

### Consequences

- Phase 2 is now complete
- These tasks remain in roadmap as deferred items
- Can be revisited if user demand or contributor activity increases

---

## Template for Future Decisions

```markdown
## ADR-XXX: [Title]

**Date**: YYYY-MM-DD
**Status**: Proposed | Accepted | Deprecated | Superseded

### Context

[Describe the situation and why a decision is needed]

### Decision

[Describe the decision made]

### Consequences

[Describe the impact of this decision]
```
