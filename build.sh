#!/bin/bash

# package.json のバージョンを 0.0.1 インクリメントして vsce package を実行

PACKAGE_JSON="package.json"

CURRENT_VERSION=$(grep '"version"' "$PACKAGE_JSON" | sed 's/.*"version": "\([^"]*\)".*/\1/')
IFS='.' read -r MAJOR MINOR PATCH <<< "$CURRENT_VERSION"

NEW_PATCH=$((PATCH + 1))
NEW_VERSION="${MAJOR}.${MINOR}.${NEW_PATCH}"

sed -i '' "s/\"version\": \"$CURRENT_VERSION\"/\"version\": \"$NEW_VERSION\"/" "$PACKAGE_JSON"
echo "Version updated: $CURRENT_VERSION -> $NEW_VERSION"

vsce package
