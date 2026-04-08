# Backlog

## Workflow Resource Implementation

- **Priority**: Medium
- **Status**: Deferred
- **Context**: The "Workflow" resource was removed from the node's resource dropdown because it had no operations implemented (empty description array), which caused a runtime error when selected. The resource module file still exists at `nodes/Sai360Grc/resources/workflow/index.ts`.
- **TODO**: Implement workflow operations (e.g., transition active workflows) and re-add the resource to `Sai360Grc.node.ts` and `router.ts`.
