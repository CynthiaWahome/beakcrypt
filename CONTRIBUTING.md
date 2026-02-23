# Contributing to Beakcrypt

First off — thank you for taking the time to contribute! 🎉

Beakcrypt is an open-source project and we genuinely welcome contributions of all kinds: bug fixes, new features, documentation improvements, and more. This guide will walk you through everything you need to know to make a great contribution.

---

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Branching Strategy](#branching-strategy)
- [Commit Message Guidelines](#commit-message-guidelines)
- [Opening a Pull Request](#opening-a-pull-request)
- [Reporting Bugs](#reporting-bugs)
- [Requesting Features](#requesting-features)
- [Code Style](#code-style)

---

## 📜 Code of Conduct

This project adheres to a standard of respectful, inclusive collaboration. By participating, you agree to treat all contributors with kindness and professionalism. Harassment, discrimination, or hostile behaviour of any kind will not be tolerated.

---

## 🚀 Getting Started

Before you start, make sure you can run the project locally. Follow the [Getting Started](./README.md#-getting-started) section in the README to set up your development environment.

Once you're set up, you're ready to contribute!

---

## 🔁 Development Workflow

We use a fork-based workflow:

1. **Fork** the repository to your own GitHub account
2. **Clone** your fork locally
3. **Set up the upstream remote** so you can sync changes:

   ```bash
   git remote add upstream https://github.com/prudentbird/beakcrypt.git
   ```

4. **Always branch off `dev`** — this is the active development branch:

   ```bash
   git fetch upstream
   git checkout -b feat/your-feature upstream/dev
   ```

5. Make your changes, write tests if applicable, and commit
6. **Push** your branch to your fork:

   ```bash
   git push origin feat/your-feature
   ```

7. Open a **Pull Request** against the `dev` branch of the upstream repo

---

## 🌿 Branching Strategy

Use the following naming conventions for your branches:

| Type          | Pattern                        | Example                  |
| ------------- | ------------------------------ | ------------------------ |
| New feature   | `feat/<short-description>`     | `feat/vault-sharing`     |
| Bug fix       | `fix/<short-description>`      | `fix/cli-auth-loop`      |
| Documentation | `docs/<short-description>`     | `docs/update-readme`     |
| Refactor      | `refactor/<short-description>` | `refactor/crypto-module` |
| Chore         | `chore/<short-description>`    | `chore/update-deps`      |

---

## ✍️ Commit Message Guidelines

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification. This keeps our git history clean and makes changelogs easy to generate.

**Format:**

```
<type>(<scope>): <short summary>
```

**Examples:**

```
feat(cli): add `beakcrypt pull` command
fix(web): resolve waitlist form submission error
docs: update local setup instructions
chore: bump pnpm to v9
refactor(crypto): simplify AES encryption helper
```

**Types:**

| Type       | When to use                                            |
| ---------- | ------------------------------------------------------ |
| `feat`     | A new feature                                          |
| `fix`      | A bug fix                                              |
| `docs`     | Documentation only changes                             |
| `style`    | Formatting, missing semicolons, etc. (no logic change) |
| `refactor` | Code restructure without feature or fix                |
| `test`     | Adding or updating tests                               |
| `chore`    | Build process, dependency updates, tooling             |

Keep the summary line under **72 characters**. Use the body to explain _why_, not _what_.

---

## 🔀 Opening a Pull Request

When you're ready to open a PR, please:

1. Fill out the **PR template** — it's there for a reason!
2. Make sure your branch is **up to date** with `upstream/dev`:

   ```bash
   git fetch upstream
   git rebase upstream/dev
   ```

3. Ensure **linting and type checks pass**:

   ```bash
   pnpm lint
   pnpm typecheck
   ```

4. Provide a clear title following the commit convention (e.g. `feat(cli): add pull command`)
5. Link any related issues using `Closes #<issue-number>` in the PR description
6. Keep PRs **focused and small** — one feature or fix per PR where possible

A maintainer will review your PR as soon as possible. We may request changes, leave comments, or approve and merge. Please be responsive to feedback!

---

## 🐛 Reporting Bugs

Found a bug? Please [open a bug report](https://github.com/prudentbird/beakcrypt/issues/new?template=bug_report.md) and include:

- A clear, descriptive title
- Steps to reproduce the issue
- Expected behaviour vs actual behaviour
- Your environment (OS, Node version, pnpm version)
- Any relevant logs or screenshots

---

## ✨ Requesting Features

Have an idea? [Open a feature request](https://github.com/prudentbird/beakcrypt/issues/new?template=feature_request.md) and tell us:

- What problem you're trying to solve
- Your proposed solution
- Any alternatives you considered

---

## 🎨 Code Style

- All code is written in **TypeScript** — no plain JS in source files
- We use **ESLint** for linting — run `pnpm lint` before committing
- Follow the existing patterns in the codebase when in doubt
- Prefer **explicit types** over `any`
- Write **self-documenting code** with clear variable and function names

---

Thank you for being part of Beakcrypt! 🐦🔐
