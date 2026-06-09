#!/bin/bash

set -e

echo "Switching to master branch..."
git checkout master

echo "Fetching latest remote references..."
git fetch --all --prune

echo "Deleting all local branches except master..."
git branch | grep -v "master" | xargs -r git branch -D

echo "Deleting all remote branches except master..."
for branch in $(git branch -r | grep 'origin/' | grep -v 'origin/master' | grep -v 'HEAD' | sed 's|origin/||'); do
echo "Deleting remote branch: $branch"
git push origin --delete "$branch"
done

echo "Cleaning up remote references..."
git fetch --prune

echo "Remaining local branches:"
git branch

echo "Remaining remote branches:"
git branch -r

echo "Cleanup completed successfully."
