# Instructions Architecture

Instructions form the bedrock of reliable AI behavior: they're the persistent rules that guide the Agent without cluttering your immediate context. Rather than repeating the same guidance in every conversation, instructions embed your team's knowledge directly into the AI's reasoning process.

The key insight is modularity: instead of one massive instruction file that applies everywhere, you create targeted files that activate only when working with specific technologies or file types. This context engineering approach keeps your AI focused and your guidance relevant.

## Architecture Philosophy

### Core Principles
1. **Domain-Driven Instructions**: Each domain has specific guidance while following global standards
2. **Context Activation**: Instructions activate based on the current work context
3. **Team Knowledge Capture**: Best practices embedded directly into AI guidance
4. **Quality Enforcement**: AI enforces architectural decisions automatically
5. **Scalable Framework**: Easy to add new domains and instruction sets

> **Context Engineering in Action**: Modular instructions preserve context space by loading only relevant guidelines when working on specific file types, leaving maximum buffer for code understanding.

### Tools & Files (example structure)
```
└── instructions/
    ├── frontend.instructions.md     # applyTo: "**/*.{jsx,tsx,css}"
    ├── backend.instructions.md      # applyTo: "**/*.{py,go,java}"
    └── testing.instructions.md      # applyTo: "**/test/**"
```

## Example: Markdown Prompt Engineering in Instructions

```yaml
---
applyTo: "**/*.{ts,tsx}"
description: "TypeScript development guidelines with context engineering"
---
```

### TypeScript Development Guidelines

#### Context Loading
Review [project conventions](../docs/conventions.md) and 
[type definitions](../types/index.ts) before starting.

#### Deterministic Requirements
- Use strict TypeScript configuration
- Implement error boundaries for React components
- Apply ESLint TypeScript rules consistently

#### Structured Output
Generate code with:
- [ ] JSDoc comments for all public APIs
- [ ] Unit tests in `__tests__/` directory
- [ ] Type exports in appropriate index files

> ⚠️ **Checkpoint**: Instructions are context-efficient and non-conflicting

## 🔗 Specifications Integration

Each domain has corresponding **specification files** in `/specs/` that define specific features to implement:

| Instructions (Behavioral Rules) | Specifications (Implementation Plans) |
|---|---|
| [`seo.instructions.md`](./seo.instructions.md) | [`../specs/seo.spec.md`](../specs/seo.spec.md) |

### How Instructions and Specs Work Together

**Instructions Answer**: *How should I behave when building this?*
- Domain rules and constraints
- Quality standards and validation requirements  
- Architectural patterns and best practices
- Cross-domain coordination guidelines

**Specifications Answer**: *What exactly should I build?*
- Feature requirements and acceptance criteria
- Technical implementation details
- API contracts and data structures
- Performance targets and edge cases

### Usage Workflow
1. **Start with Instructions**: Understand the behavioral rules for the domain
2. **Reference Specifications**: Get specific feature requirements and technical details
3. **Follow Both**: Instructions guide *how to work*, specs define *what to deliver*
4. **Cross-Reference**: Many features span multiple domains - check related instruction files