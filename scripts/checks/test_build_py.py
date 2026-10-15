"""Unit tests for build.py (run by scripts/checks/build-local.sh).

    python3 -m unittest discover -s scripts/checks -p 'test_build_py.py'
"""
import contextlib
import io
import json
import os
import shutil
import subprocess
import sys
import tempfile
import unittest
from unittest import mock

REPO_ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
sys.path.insert(0, REPO_ROOT)

import build  # noqa: E402


class LockedLedgerModelsVersionTest(unittest.TestCase):
    def test_reads_the_locked_version(self):
        lock = json.dumps({'packages': {'node_modules/@fintekkers/ledger-models': {'version': '0.4.52'}}})
        self.assertEqual(build.locked_ledger_models_version(lock), '0.4.52')

    def test_exits_when_the_entry_is_missing(self):
        lock = json.dumps({'packages': {'node_modules/other': {'version': '1.0.0'}}})
        with self.assertRaises(SystemExit) as raised:
            build.locked_ledger_models_version(lock)
        self.assertIn('@fintekkers/ledger-models', str(raised.exception.code))

    def test_exits_when_there_are_no_packages(self):
        with self.assertRaises(SystemExit):
            build.locked_ledger_models_version('{}')


class ParseArgsTest(unittest.TestCase):
    def test_local_flag(self):
        self.assertTrue(build.parse_args(['--local']).local)

    def test_no_flag_exits_non_zero_naming_build_deploy(self):
        stderr = io.StringIO()
        with contextlib.redirect_stderr(stderr), self.assertRaises(SystemExit) as raised:
            build.parse_args([])
        self.assertNotEqual(raised.exception.code, 0)
        self.assertIn('build_deploy.py', stderr.getvalue())

    def test_help_documents_local(self):
        stdout = io.StringIO()
        with contextlib.redirect_stdout(stdout), self.assertRaises(SystemExit) as raised:
            build.parse_args(['--help'])
        self.assertEqual(raised.exception.code, 0)
        self.assertIn('--local', stdout.getvalue())
        self.assertIn('python build.py --local', stdout.getvalue())


class LocalBuildTest(unittest.TestCase):
    def setUp(self):
        self.root = tempfile.mkdtemp()
        self.addCleanup(shutil.rmtree, self.root)
        self.originals = {
            'package-lock.json': json.dumps(
                {'packages': {'node_modules/@fintekkers/ledger-models': {'version': '0.4.45'}}}),
            'package.json': '{"name": "ui-service"}',
        }
        for name, content in self.originals.items():
            self.write(name, content)
        patcher = mock.patch.object(build, 'REPO_ROOT', self.root)
        patcher.start()
        self.addCleanup(patcher.stop)

    def write(self, name, content):
        with open(os.path.join(self.root, name), 'w') as f:
            f.write(content)

    def read(self, name):
        with open(os.path.join(self.root, name)) as f:
            return f.read()

    def fake_npm(self, fail_on=None):
        """Stands in for npm: `update` bumps the lock, `fail_on` raises."""
        calls = []

        def npm(*args):
            calls.append(args[0])
            if args[0] == 'update':
                self.write('package-lock.json', json.dumps(
                    {'packages': {'node_modules/@fintekkers/ledger-models': {'version': '0.4.52'}}}))
                self.write('package.json', '{"name": "ui-service", "changed": true}')
            if args[0] == fail_on:
                raise subprocess.CalledProcessError(1, ['npm', *args])
        return npm, calls

    def test_logs_the_refreshed_version_and_restores_the_files(self):
        npm, calls = self.fake_npm()
        stdout = io.StringIO()
        with mock.patch.object(build, 'npm', npm), contextlib.redirect_stdout(stdout):
            build.local_build()
        self.assertEqual(calls, ['ci', 'update', 'rebuild', 'run'])
        self.assertIn('ledger-models 0.4.52', stdout.getvalue())
        for name, content in self.originals.items():
            self.assertEqual(self.read(name), content)

    def test_restores_the_files_when_npm_fails(self):
        npm, calls = self.fake_npm(fail_on='run')
        with mock.patch.object(build, 'npm', npm), contextlib.redirect_stdout(io.StringIO()), \
                self.assertRaises(subprocess.CalledProcessError):
            build.local_build()
        self.assertEqual(calls, ['ci', 'update', 'rebuild', 'run'])
        for name, content in self.originals.items():
            self.assertEqual(self.read(name), content)


if __name__ == '__main__':
    unittest.main()
