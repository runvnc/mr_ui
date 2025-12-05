from setuptools import setup, find_packages

setup(
    name="mr_ui",
    version="1.0.0",
    packages=find_packages(where="src"),
    package_dir={"": "src"},
    package_data={
        "mr_ui": [
            "static/js/*.js",
            "inject/*.jinja2",
        ],
    },
    include_package_data=True,
)
