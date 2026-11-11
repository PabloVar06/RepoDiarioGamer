"""Pruebas reales de pre-commit en repositorios temporales sin archivos .env."""

from pathlib import Path
import shutil
import subprocess
import tempfile
import unittest


ROOT = Path(__file__).resolve().parents[2]


class HookTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory(prefix="savepoint-hooks-")
        self.addCleanup(self.temp.cleanup)
        self.repo = Path(self.temp.name)
        for folder in ("scripts", ".githooks"):
            shutil.copytree(ROOT / folder, self.repo / folder)
        shutil.copy(ROOT / ".prettierrc.json", self.repo)
        (self.repo / "node_modules").symlink_to(ROOT / "node_modules", target_is_directory=True)
        self.git("init", "-q")
        self.git("config", "user.name", "Harness Test")
        self.git("config", "user.email", "harness@example.invalid")
        result = self.run_tool("install")
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertEqual(self.git("config", "--get", "core.hooksPath").strip(), b".githooks")

    def git(self, *args, data=None):
        return subprocess.check_output(["git", *args], cwd=self.repo, input=data)

    def run_tool(self, command):
        return subprocess.run(["python3", "scripts/harness.py", command], cwd=self.repo,
                              capture_output=True, text=True)

    def commit(self):
        return subprocess.run(["git", "commit", "-qm", "harness fixture"], cwd=self.repo,
                              capture_output=True, text=True)

    def stage(self, name, data):
        # Inserta blobs sintéticos: no crea, lee ni modifica un archivo .env.
        oid = self.git("hash-object", "-w", "--stdin", data=data).decode().strip()
        self.git("update-index", "--add", "--cacheinfo", "100644," + oid + "," + name)

    def test_formatted_commit_passes(self):
        self.stage("good.ts", b"const value = 1;\n")
        result = self.commit()
        self.assertEqual(result.returncode, 0, result.stderr)

    def test_unformatted_commit_is_blocked(self):
        self.stage("bad.ts", b"const value={a:1}\n")
        result = self.commit()
        self.assertNotEqual(result.returncode, 0)
        self.assertIn("Formato pendiente", result.stderr)

    def test_mdc_document_uses_markdown_parser(self):
        self.stage("docs/example.mdc", b"---\nalwaysApply: true\n---\n\n# Rule\n")
        result = self.commit()
        self.assertEqual(result.returncode, 0, result.stderr)

    def test_checks_staged_content_not_worktree(self):
        self.stage("partial.ts", b"const value={a:1}\n")
        (self.repo / "partial.ts").write_text("const value = { a: 1 };\n")
        result = self.commit()
        self.assertNotEqual(result.returncode, 0)
        self.assertIn("Formato pendiente", result.stderr)

    def test_env_variants_blocked_without_content_disclosure(self):
        for name in (".env", "backend/.env", "frontend/.env.local", ".env.example",
                     "backend/._.env", ".env.folder/config.json"):
            with self.subTest(name=name):
                self.git("read-tree", "--empty")
                self.stage(name, b"SYNTHETIC_SENTINEL_NOT_A_SECRET")
                result = self.commit()
                self.assertNotEqual(result.returncode, 0)
                self.assertIn("Bloqueado", result.stderr)
                self.assertNotIn("SYNTHETIC_SENTINEL", result.stdout + result.stderr)
                self.assertFalse((self.repo / name).exists())

    def test_env_deletion_is_blocked(self):
        self.stage("backend/.env", b"synthetic baseline")
        tree = self.git("write-tree").decode().strip()
        # Crear una base sintética sin saltarse hooks con git commit --no-verify.
        commit = self.git("commit-tree", tree, data=b"synthetic base\n").decode().strip()
        self.git("update-ref", "HEAD", commit)
        self.git("update-index", "--force-remove", "backend/.env")
        result = self.commit()
        self.assertNotEqual(result.returncode, 0)
        self.assertIn("Bloqueado", result.stderr)

    def test_env_rename_origin_is_blocked(self):
        self.stage("backend/.env", b"synthetic baseline")
        tree = self.git("write-tree").decode().strip()
        commit = self.git("commit-tree", tree, data=b"synthetic base\n").decode().strip()
        self.git("update-ref", "HEAD", commit)
        self.git("update-index", "--force-remove", "backend/.env")
        self.stage("renamed.txt", b"synthetic baseline")
        result = self.commit()
        self.assertNotEqual(result.returncode, 0)
        self.assertIn("Bloqueado", result.stderr)

    def test_symlink_content_is_not_formatted(self):
        oid = self.git("hash-object", "-w", "--stdin", data=b".env").decode().strip()
        self.git("update-index", "--add", "--cacheinfo", "120000," + oid + ",alias.md")
        result = self.commit()
        self.assertEqual(result.returncode, 0, result.stderr)

    def test_existing_hook_path_is_preserved(self):
        self.git("config", "core.hooksPath", "other-hooks")
        result = self.run_tool("install")
        self.assertNotEqual(result.returncode, 0)
        self.assertEqual(self.git("config", "--get", "core.hooksPath").strip(), b"other-hooks")

    def test_missing_formatter_blocks_commit(self):
        (self.repo / "node_modules").unlink()
        self.stage("good.ts", b"const value = 1;\n")
        result = self.commit()
        self.assertNotEqual(result.returncode, 0)
        self.assertIn("Falta Prettier", result.stderr)


if __name__ == "__main__":
    unittest.main()
