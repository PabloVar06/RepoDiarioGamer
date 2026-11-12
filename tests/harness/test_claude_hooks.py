"""Ejecuta los comandos configurados para Claude con payloads sintéticos."""

import json
import os
from pathlib import Path
import shutil
import subprocess
import tempfile
import unittest


ROOT = Path(__file__).resolve().parents[2]
SETTINGS = json.loads((ROOT / ".claude/settings.json").read_text())


class ClaudeHookTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory(prefix="savepoint-claude-")
        self.addCleanup(self.temp.cleanup)
        self.repo = Path(self.temp.name)
        shutil.copytree(ROOT / "scripts", self.repo / "scripts")
        shutil.copy(ROOT / ".prettierrc.json", self.repo)
        (self.repo / "node_modules").symlink_to(ROOT / "node_modules", target_is_directory=True)

    def invoke(self, event, tool, inputs, raw=None):
        entry = SETTINGS["hooks"][event][0]
        self.assertIn(tool, entry["matcher"].split("|"))
        command = entry["hooks"][0]["command"]
        payload = {"hook_event_name": event, "tool_name": tool,
                   "tool_input": inputs, "cwd": str(self.repo)}
        return subprocess.run(command, shell=True, cwd=self.repo,
                              input=json.dumps(payload) if raw is None else raw,
                              env={**os.environ, "CLAUDE_PROJECT_DIR": str(self.repo)},
                              text=True, capture_output=True)

    def test_posttooluse_formats_only_target(self):
        target = self.repo / "file with spaces.ts"
        target.write_text("const x={a:1}\n")
        other = self.repo / "untouched.ts"
        other.write_text("const y={b:2}\n")
        result = self.invoke("PostToolUse", "Write", {"file_path": str(target)})
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertEqual(target.read_text(), "const x = { a: 1 };\n")
        self.assertEqual(other.read_text(), "const y={b:2}\n")

    def test_pretooluse_blocks_env_paths_without_opening_them(self):
        for tool in ("Read", "Write", "Edit", "MultiEdit"):
            for name in (".env", "backend/.env", "frontend/.env.local", ".env.example"):
                with self.subTest(tool=tool, path=name):
                    result = self.invoke("PreToolUse", tool,
                                         {"file_path": str(self.repo / name)})
                    self.assertEqual(result.returncode, 2)
                    self.assertFalse((self.repo / name).exists())

    def test_pretooluse_allows_normal_edit(self):
        result = self.invoke("PreToolUse", "Edit", {"file_path": "src/App.tsx"})
        self.assertEqual(result.returncode, 0, result.stderr)

    def test_pretooluse_blocks_explicit_shell_reference(self):
        result = self.invoke("PreToolUse", "Bash", {"command": "printf value > backend/.env"})
        self.assertEqual(result.returncode, 2)
        self.assertFalse((self.repo / "backend/.env").exists())

    def test_pretooluse_allows_harness_test_command(self):
        result = self.invoke("PreToolUse", "Bash", {"command": "npm run harness:test"})
        self.assertEqual(result.returncode, 0, result.stderr)

    def test_symlink_to_protected_path_is_blocked(self):
        (self.repo / "alias.md").symlink_to(self.repo / ".env")
        result = self.invoke("PreToolUse", "Edit", {"file_path": "alias.md"})
        self.assertEqual(result.returncode, 2)
        self.assertFalse((self.repo / ".env").exists())

    def test_posttooluse_never_reads_env_even_without_pre_hook(self):
        result = self.invoke("PostToolUse", "Write", {"file_path": ".env"})
        self.assertEqual(result.returncode, 2)

    def test_outside_project_is_blocked(self):
        result = self.invoke("PreToolUse", "Write", {"file_path": "../outside.ts"})
        self.assertEqual(result.returncode, 2)

    def test_bad_input_fails_closed(self):
        result = self.invoke("PreToolUse", "Edit", {}, raw="not json")
        self.assertEqual(result.returncode, 2)

    def test_missing_prettier_reports_failure(self):
        (self.repo / "node_modules").unlink()
        (self.repo / "sample.ts").write_text("const x={a:1}\n")
        result = self.invoke("PostToolUse", "Edit", {"file_path": "sample.ts"})
        self.assertEqual(result.returncode, 2)
        self.assertEqual((self.repo / "sample.ts").read_text(), "const x={a:1}\n")

    def test_claude_import_is_preserved(self):
        (self.repo / "CLAUDE.md").write_bytes(b"@AGENTS.md\n")
        result = self.invoke("PostToolUse", "Write", {"file_path": "CLAUDE.md"})
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertEqual((self.repo / "CLAUDE.md").read_bytes(), b"@AGENTS.md\n")


class HarnessRulesTests(unittest.TestCase):
    def test_required_entrypoints(self):
        self.assertEqual((ROOT / "CLAUDE.md").read_bytes(), b"@AGENTS.md\n")
        self.assertLessEqual(len((ROOT / "AGENTS.md").read_text().splitlines()), 60)

    def test_commit_skills_have_manual_controls_and_five_steps(self):
        for folder in (".claude", ".agents"):
            text = (ROOT / folder / "skills/commit/SKILL.md").read_text()
            body = text.split("---", 2)[2]
            for number in range(1, 6):
                self.assertIn("\n" + str(number) + ". ", "\n" + body)
            for rule in ("git diff --staged", "Nunca ejecutar", "git add",
                         "contraseñas", "tokens", "claves", "credenciales",
                         "72 caracteres", "git push", "git write-tree"):
                self.assertIn(rule, text)
            self.assertNotIn("!`", text)
        claude = (ROOT / ".claude/skills/commit/SKILL.md").read_text()
        expected_header = (
            "---\nname: commit\n"
            "description: Crea un commit seguro de los cambios previamente preparados "
            "en staging cuando el usuario ejecuta /commit.\n"
            "disable-model-invocation: true\n---\n"
        )
        self.assertTrue(claude.startswith(expected_header))
        policy = (ROOT / ".agents/skills/commit/agents/openai.yaml").read_text()
        self.assertIn("allow_implicit_invocation: false", policy)


if __name__ == "__main__":
    unittest.main()
