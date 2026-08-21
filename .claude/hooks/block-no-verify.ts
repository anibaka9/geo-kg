const input = JSON.parse(await Bun.stdin.text());
const command = input.tool_input?.command ?? "";

const bypassPattern = /(^|\s)(--no-verify|HUSKY=0|LEFTHOOK=0|LEFTHOOK_EXCLUDE=)/u;

if (!bypassPattern.test(command)) {
  process.exit(0);
}

process.stdout.write(
  JSON.stringify({
    hookSpecificOutput: {
      hookEventName: "PreToolUse",
      permissionDecision: "deny",
      permissionDecisionReason:
        "Do not bypass local verification. Fix the failing guardrail instead. Run 'bun run check' to verify.",
    },
  }),
);

process.exit(0);
