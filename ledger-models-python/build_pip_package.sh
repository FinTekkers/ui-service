# python -m build src/
#  pip3 uninstall -y fintekkers_devops_scripts
#  pip3 install .  -vvv   
#  pip3 install ./dist/fintekkers_devops_scripts-0.0.1-py3-none-any.whl --force-reinstall
export PACKAGE=fintekkers_ledger_models
pip3 uninstall -y $PACKAGE

rm -rf __pycache__
rm -rf build
rm -rf dist
rm -rf src/$PACKAGE.egg-info

cd src

python3 setup.py sdist bdist_wheel

pip3 install ./dist/$PACKAGE-0.0.1-py3-none-any.whl --force-reinstall