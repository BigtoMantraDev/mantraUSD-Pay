# OpenSpec Documentation for mantraUSD-Pay Smart Contracts

This directory contains the OpenSpec specifications for the smart contracts powering the EIP-7702 gasless scan-to-pay system.

## Overview

OpenSpec is a spec-driven development framework that helps teams document requirements, design decisions, and implementation plans before writing code. This ensures alignment between stakeholders and provides a single source of truth.

## Structure

```
openspec/
├── AGENTS.md          # Instructions for AI assistants working with OpenSpec
├── project.md         # Project context and conventions
├── specs/             # Capability specifications (what IS built)
│   ├── delegated-account/
│   │   ├── spec.md    # Requirements and scenarios
│   │   └── design.md  # Technical design decisions
│   └── session-registry/
│       ├── spec.md    # Requirements and scenarios
│       └── design.md  # Technical design decisions
└── changes/           # Future change proposals (what SHOULD change)
```

## Smart Contract Capabilities

### 1. Delegated Account (`specs/delegated-account/`)

The EIP-7702 implementation contract that enables temporary EOA delegation for gasless transactions.

**Key Requirements:**
- EIP-712 signature verification
- Nonce management for replay attack prevention
- Deadline enforcement for signature expiration
- Atomic execution of authorized operations
- EIP-1271 compatibility

**Metrics:**
- 13 requirements
- 33 scenarios covering all edge cases
- Comprehensive design documentation

**Files:**
- `spec.md` - Formal requirements with WHEN/THEN scenarios
- `design.md` - Technical decisions, architecture, and trade-offs

### 2. Session Registry (`specs/session-registry/`)

The payment session management contract that tracks merchant payment requests and coordinates fulfillment.

**Key Requirements:**
- Session creation and lifecycle management
- Dual fee model (customer + merchant fees)
- Independent fee toggle controls
- Token whitelist management
- Session fulfillment and cancellation
- Fee collection and withdrawal

**Metrics:**
- 13 requirements
- 55 scenarios covering all edge cases
- Comprehensive design documentation

**Files:**
- `spec.md` - Formal requirements with WHEN/THEN scenarios
- `design.md` - Technical decisions, architecture, and trade-offs

## Using These Specs

### For Developers

1. **Before Implementation**: Read the `spec.md` to understand what needs to be built
2. **During Implementation**: Refer to `design.md` for architectural guidance
3. **During Testing**: Use scenarios as test case templates
4. **For Documentation**: specs provide single source of truth for documentation

### For Auditors

- All security requirements are documented with scenarios
- Design decisions explain rationale for implementation choices
- Edge cases are enumerated in scenarios
- Access control and validation rules are explicit

### For Product Managers

- Requirements are written in plain language
- Each requirement has concrete scenarios showing expected behavior
- Non-functional requirements (security, performance) are documented
- Trade-offs and design decisions are explained

## Spec Format

### Requirements

Each requirement follows this pattern:

```markdown
### Requirement: [Name]

[Description of what the system SHALL/MUST do]

#### Scenario: [Scenario Name]
- **WHEN** [condition]
- **THEN** [expected outcome]
- **AND** [additional expectation]
```

### Key Points

- Every requirement MUST have at least one scenario
- Scenarios use `#### Scenario:` (4 hashtags)
- Use SHALL/MUST for normative requirements
- Use WHEN/THEN pattern for clarity

## Validation

To validate the specs were created correctly:

```bash
# Count requirements and scenarios
grep -c "^### Requirement:" openspec/specs/*/spec.md
grep -c "^#### Scenario:" openspec/specs/*/spec.md

# Verify all requirements have scenarios (Python)
python3 -c "
import re
for spec in ['delegated-account', 'session-registry']:
    with open(f'openspec/specs/{spec}/spec.md') as f:
        content = f.read()
    sections = re.split(r'^### Requirement:', content, flags=re.MULTILINE)
    for section in sections[1:]:
        if not re.search(r'^#### Scenario:', section, re.MULTILINE):
            print(f'{spec}: Missing scenario in {section[:50]}')
"
```

## Creating Changes

When proposing changes to the smart contracts:

1. Create a change proposal in `openspec/changes/[change-name]/`
2. Include `proposal.md`, `tasks.md`, and delta specs
3. Follow the OpenSpec workflow documented in `AGENTS.md`
4. Use `## ADDED`, `## MODIFIED`, or `## REMOVED` headers for deltas

See `AGENTS.md` for detailed instructions on the OpenSpec workflow.

## Design Philosophy

The specs follow these principles:

1. **Stateless where possible**: Minimize on-chain state
2. **Security first**: Multiple validation layers
3. **Gas efficiency**: Optimize for relayer costs
4. **Standards compliance**: EIP-7702, EIP-712, EIP-1271
5. **Simplicity**: Avoid premature optimization
6. **Auditability**: Clear, documented behavior

## Links

- [PRD Document](../docs/mantraUSD-Pay-PRD.md) - Product Requirements Document
- [OpenSpec AGENTS.md](./AGENTS.md) - Full OpenSpec workflow guide
- [Project Context](./project.md) - Project conventions and stack

## Questions?

For questions about:
- **OpenSpec format**: See `AGENTS.md`
- **Smart contract requirements**: See `specs/*/spec.md`
- **Design decisions**: See `specs/*/design.md`
- **Project context**: See `project.md`
