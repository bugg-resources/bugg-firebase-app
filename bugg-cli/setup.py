from setuptools import setup

setup(
    name='bugg',
    version='0.0.1',
    scripts=['bin/bugg'],
    install_requires=[
        'tqdm',
        'google-cloud-storage'
    ],
)