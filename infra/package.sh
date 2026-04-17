#!/bin/bash
set -e

echo "Packaging Lambda function..."

# Install all dependencies into a flat target directory
pip install -r requirements.txt -t ./package --quiet

# ⚠️  macOS Apple Silicon (M1/M2/M3) users:
# Packages compiled for Apple Silicon are NOT compatible with Lambda's Linux x86_64 runtime.
# Replace the pip install line above with:
#
# pip install -r requirements.txt -t ./package \
#   --platform manylinux2014_x86_64 \
#   --only-binary=:all: \
#   --python-version 3.12 \
#   --quiet

# Copy all root-level Python source files into the package
cp *.py package/

# Create the ZIP from inside the package directory
cd package
zip -r ../infra/lambda.zip . --quiet
cd ..

# Clean up the temporary directory
rm -rf package

echo "Done: infra/lambda.zip created"
ls -lh infra/lambda.zip
