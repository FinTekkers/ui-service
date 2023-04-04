from setuptools import setup, find_packages

VERSION = '0.0.0' 
DESCRIPTION = 'My first Python package'
LONG_DESCRIPTION = 'My first Python package with a slightly longer description'

# Setting up
setup(

    name = "fintekkers-ledger-models",
    license='MIT',
    author="David Doherty",
    author_email='dave@fintekkers.org',
    include_package_data=True,
#     package_dir={'fintekkers': 'src/fintekkers'},
#     packages=find_packages(),
#     package_data={'fintekkers': stubs},
    url='https://github.com/fintekkers/ledger-models',
    keywords='fintekkers ledger models',
#     install_requires=[],
       # the name must match the folder name 'verysimplemodule'

        version=VERSION,
        description=DESCRIPTION,
        long_description=LONG_DESCRIPTION,
        packages=find_packages(),
        install_requires=[], # add any additional packages that 
        # needs to be installed along with your package. Eg: 'caer'
        
        # classifiers= [
        #     "Development Status :: 3 - Alpha",
        #     "Intended Audience :: Education",
        #     "Programming Language :: Python :: 2",
        #     "Programming Language :: Python :: 3",
        #     "Operating System :: MacOS :: MacOS X",
        #     "Operating System :: Microsoft :: Windows",
        # ]
)
# from setuptools import find_packages, setup

# def find_stubs(top: str) -> list[str]:
#     stubs = []
#     for root, _, files in os.walk(top):
#         dir = root.split(os.path.sep, 1)[-1] # rid of 'top'
#         for f in files:
#             if f.endswith('.pyi'):
#                 if os.path.sep in root:
#                     f = os.path.join(dir, f)
#                 stubs.append(f)
#     return stubs

# import os

# version = '0.0.0'
# # packages = find_packages('src')

# # os.chdir('src')
# # print(os.getcwd())

# stubs = find_stubs('.')
# # stubs.append('src/py.typed')
# stubs.append('fintekkers/py.typed')
# stubs.append('py.typed')

# if 'BUILD_VERSION' in os.environ:
#     print("******************************************")
#     print("************OVERRIDING VERSION FROM ENVIRONMENT******************")
#     print("******************************************")
#     version = os.environ.get('BUILD_VERSION')

# print("******************************************")
# print("******************************************")
# print("******************************************")
# print(f"********VERSION={version}***************************")
# print("******************************************")
# print("******************************************")
# print("******************************************")

# setup(
#     name = "fintekkers-ledger-models",
#     version=version,
#     license='MIT',
#     author="David Doherty",
#     author_email='davidjdoherty@gmail.com.com',
#     package_dir={'fintekkers': 'src/fintekkers'},
#     packages=find_packages(),
#     package_data={'fintekkers': stubs},
#     url='https://github.com/fintekkers/ledger-models',
#     keywords='fintekkers ledger models',
#     install_requires=[],
# )