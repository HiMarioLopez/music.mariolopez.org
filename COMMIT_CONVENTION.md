# Conventional Commit Reference Guide

This project follows [Conventional Commits](https://www.conventionalcommits.org/) to automate versioning and release notes.

## Basic Format

```text
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

## Types

| Type       | Description                                         | Triggers Version Bump |
|------------|-----------------------------------------------------|----------------------|
| `feat`     | ✨ A new feature                                    | Minor ✅              |
| `fix`      | 🐛 A bug fix                                        | Patch ✅              |
| `docs`     | 📝 Documentation only changes                       | None                 |
| `style`    | 💄 Changes that don't affect code logic             | None                 |
| `refactor` | ♻️ Code changes that neither fix bugs nor add features | None              |
| `perf`     | ⚡ Performance improvements                         | None                 |
| `test`     | 🧪 Adding or correcting tests                       | None                 |
| `build`    | 📦 Changes to build system or dependencies          | None                 |
| `ci`       | 👷 Changes to CI configuration                      | None                 |
| `chore`    | 🧹 Other changes that don't modify source/test files | None                |

## Breaking Changes

For breaking changes, either:

1. Add an exclamation mark after the type:

   ```text
   feat!: introduce a breaking API change
   ```

2. Or include a BREAKING CHANGE footer:

   ```text
   feat: add new feature

   BREAKING CHANGE: this change breaks the existing API
   ```

Both methods will trigger a major version bump.

## Examples

### Feature

```text
feat: add template for Serverless Framework
```

### Bug Fix

```text
fix: correct path resolution in generator
```

### Documentation Change

```text
docs: update README with PowerTools usage examples
```

### Breaking Change

```text
feat!: require Node.js 22 for all projects
```

### With Scope

```text
feat(templates): add SAM template with container images
```

### With Body

```text
fix: handle empty project name input

This change prevents crashes when users press enter without providing
a project name during the interactive prompt.
```

### With Footer

```text
feat: implement Jest template

Refs: #123
```

## Pre-commit Hook

A pre-commit hook has been set up using husky and commitlint to enforce this format. If your commit message doesn't follow the conventional format, the commit will be rejected.
