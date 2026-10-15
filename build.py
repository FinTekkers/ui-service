"""Build ui-service in this checkout, for the box.

    python build.py --local

--local installs the lockfile's dependencies (`npm ci --ignore-scripts`),
refreshes ledger-models to the newest version in package.json's range
(`npm update @fintekkers/ledger-models --ignore-scripts`; every other
dependency stays on its package-lock.json version), logs
`ledger-models <version>`, rebuilds better-sqlite3's native binding (skipped
by --ignore-scripts, which node-sass's broken install script needs), then
runs `npm run build`. The server lands in build/ (`node build`).
package-lock.json and package.json are restored afterwards so the checkout
stays clean for the next pull; node_modules keeps the refreshed version.

Build-time env vars (GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET,
CONTACT_GMAIL_USER, CONTACT_GMAIL_APP_PASSWORD, ...) come from the caller.

The AWS/EC2 deploy is unchanged: it is `python build_deploy.py`.
"""
import argparse
import json
import os
import subprocess

REPO_ROOT = os.path.dirname(os.path.abspath(__file__))
LEDGER_MODELS = '@fintekkers/ledger-models'
# Restored after the build: the refresh rewrites the lockfile, and host npm
# also churns it (drops optional deps' "libc" fields).
RESTORED_FILES = ('package-lock.json', 'package.json')


def npm(*args: str) -> None:
    subprocess.run(['npm', *args], cwd=REPO_ROOT, check=True)


def locked_ledger_models_version(lock: str) -> str:
    """The version package-lock.json resolves ledger-models to."""
    package = json.loads(lock).get('packages', {}).get('node_modules/' + LEDGER_MODELS)
    if not package or not package.get('version'):
        raise SystemExit('package-lock.json has no {} entry'.format(LEDGER_MODELS))
    return package['version']


def local_build() -> None:
    originals = {}
    for name in RESTORED_FILES:
        with open(os.path.join(REPO_ROOT, name)) as f:
            originals[name] = f.read()
    try:
        npm('ci', '--ignore-scripts', '--no-audit', '--no-fund')
        npm('update', LEDGER_MODELS, '--ignore-scripts', '--no-audit', '--no-fund')
        with open(os.path.join(REPO_ROOT, 'package-lock.json')) as f:
            print('ledger-models {}'.format(locked_ledger_models_version(f.read())), flush=True)
        npm('rebuild', 'better-sqlite3')
        npm('run', 'build')
    finally:
        for name, content in originals.items():
            with open(os.path.join(REPO_ROOT, name), 'w') as f:
                f.write(content)


def parse_args(argv=None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument('--local', action='store_true',
                        help='refresh ledger-models within range and build ui-service in this checkout')
    args = parser.parse_args(argv)
    if not args.local:
        parser.error('--local is the only mode; the AWS/EC2 deploy is `python build_deploy.py`')
    return args


def main(argv=None) -> None:
    parse_args(argv)
    local_build()


if __name__ == '__main__':
    main()
