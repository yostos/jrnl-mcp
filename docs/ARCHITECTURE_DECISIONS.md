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
