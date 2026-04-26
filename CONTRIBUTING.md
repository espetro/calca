# Contributing to Calca

Thank you for your interest in contributing to Calca! This document outlines the
contribution process and licensing terms.

## Dual-License Model

Calca is distributed under a **dual-license model**:

- **Core (AGPL-3.0)**: All code in `apps/*`, `packages/core`, `packages/shared`,
  and other non-`pro` packages is licensed under the GNU Affero General Public
  License v3. This is free, open-source software.
- **Enterprise/Pro (ELv2)**: Code in `packages/pro/` is licensed under the
  Elastic License v2. This is proprietary software with usage restrictions.

## Contributor License Agreement (CLA)

All contributions to this project are accepted under the terms of our
[Contributor License Agreement (CLA)](./CLA.md).

By submitting a pull request, you agree that:

1. You have read and agree to the [CLA](./CLA.md)
2. Your contributions are your original work
3. You grant the project maintainer the right to relicense your contributions
   under the AGPL-3.0 or ELv2 licenses
4. You retain copyright to your contributions

**Please sign the CLA here:** https://cla-assistant.io/espetro/calca

## Why a CLA?

The CLA allows us to:

- Maintain the open-source AGPL core while also offering an Enterprise/Pro
  edition under ELv2
- Ensure we have the legal right to include community improvements in both
  editions
- Protect both contributors and the project from legal ambiguity

## How to Contribute

1. **Fork the repository** and create a feature branch
2. **Make your changes** following the existing code style
3. **Add tests** for any new functionality
4. **Update documentation** if needed
5. **Ensure the CLA is signed** (check the CLA assistant status on your PR)
6. **Submit a pull request** with a clear description

## Contribution Guidelines

- Follow the existing Feature-Sliced Design (FSD) architecture in `apps/web/`
- Maintain TypeScript strict mode compliance
- Write clear commit messages following [Conventional Commits](https://www.conventionalcommits.org/)
- Do not modify existing source code logic unless necessary
- Do not move or rename existing files without discussion

## What Can I Contribute To?

### AGPL Core (Open Source)

- Bug fixes and improvements to existing features
- New features that belong in the open-source core
- Documentation and translations
- Tests and tooling

### Enterprise/Pro (ELv2)

- We generally do not accept external contributions to `packages/pro/` unless
  explicitly discussed in an issue first
- If you believe a feature should be in the Enterprise edition, open an issue
  to discuss it first

## Questions?

If you have questions about licensing or the CLA, please open an issue at https://github.com/espetro/calca/discussions.

## Code of Conduct

Be respectful, constructive, and inclusive. We welcome contributors of all
experience levels.
