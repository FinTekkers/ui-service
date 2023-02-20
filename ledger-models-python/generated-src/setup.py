from setuptools import find_packages, setup
import os

from setuptools import find_packages, setup

def find_stubs(top: str) -> list[str]:
    stubs = []
    for root, _, files in os.walk(top):
        dir = root.split(os.path.sep, 1)[-1] # rid of 'top'
        for f in files:
            if f.endswith('.pyi'):
                if os.path.sep in root:
                    f = os.path.join(dir, f)
                stubs.append(f)
    return stubs

packages = find_packages()

print("***************************************************")
print("***************************************************")
print("***************************************************")
print(packages)
print("***************************************************")
print("***************************************************")
print("***************************************************")

stubs = find_stubs('fintekkers')
stubs.append('py.typed')

setup(
    name='fintekkers-ledger-models',
    version='0.0.1',
    packages=packages,
    package_data={"fintekkers": stubs},
    # py_modules=['fintekkers']
)


# src_folder = '.'
# packages = find_packages(where=src_folder)

# print(packages)

# def package_files(directory):
#     paths = []
#     for (path, directories, filenames) in os.walk(directory):
#         for filename in filenames:
#             paths.append(os.path.join(path.replace(src_folder+'/', ''), filename))

#     print(paths)
#     return paths

# extra_files = package_files('.')

# setup(
#     name='fintekkers-ledger-models',
#     # package_dir = {"": "src"}
#     version='0.0.1',
#     # package_dir={'':'src'},
#     packages=packages,
#     package_data={'': extra_files},
#     # package_data=['fintekkers', 'dummyService'],
#     py_modules=['models', 'requests', 'services']
# )