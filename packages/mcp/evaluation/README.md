# Evaluation

Ten questions an agent should be able to answer with only this server's tools, and the answer to each. They are read-only, independent of each other, and each takes many tool calls (about 170 in all when solved by hand with the tools): paging a list, filtering by tier and category, opening component after component, reading one part of a compound component, looking up a token's alias in one theme, and reading the agent guide.

- `evaluation.xml` holds the questions and answers, in the format of the MCP builder's evaluation harness.
- `verify.mjs` recomputes every answer from the files the packages ship, without the server, and exits non-zero when one differs. **The answers describe the installed release**: run it whenever the packages change (`pnpm build && node evaluation/verify.mjs`) and fix the answer or reword the question when it fails. It also fails when an answer is tied, since a tie means the question needs rewording.

To measure how well an agent does with the tools, run the harness from the MCP builder skill against the built server (it needs Python, the `anthropic` and `mcp` packages and an `ANTHROPIC_API_KEY`, none of which belong to this repository):

```bash
python scripts/evaluation.py evaluation.xml -t stdio -c node -a /path/to/packages/mcp/dist/index.js -o report.md
```

The report shows which answers were wrong and the agent's own feedback on the tools; read the feedback before changing a tool's description.
