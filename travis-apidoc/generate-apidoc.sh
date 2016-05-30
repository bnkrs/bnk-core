#!/bin/bash

echo "Starting apidoc-generation for bnk-core."
echo "It is $(date)."
echo

# Deleting old folders
rm -rf ./repo
rm -rf ./branches

# Preparing folders for script
mkdir ./branches

# Cloning the repo
echo "Cloning the bnk-core repo"
git clone ssh://git@github.com/bnkrs/bnk-core.git ./repo 2>&1
echo

# Cloning the apidoc-repo
echo "Cloning the apidoc-repo"
git clone ssh://git@github.com/bnkrs/apidoc.git ./docrepo 2>&1
echo

echo "Changing directory..."
cd ./repo
echo

# Nescessary, creating local branches for all remotes
echo "Checking out all remote branches"
for branch in $(git branch --all | grep '^\s*remotes' | egrep --invert-match '(:?HEAD|master)$'); do
    git branch --track "${branch##*/}" "$branch" 2>&1
done
echo

for BRANCH in $(git branch | cut -c 3-); do
  echo "Checking out \"${BRANCH}\""
  git checkout "$BRANCH" 2>&1

  rm -rf "../docrepo/$BRANCH"
  echo "Generating apidoc"
  apidoc -o "../docrepo/$BRANCH" -i "./routes" 2>&1
  echo
  echo
done

echo "apidocs generated, comitting..."
cd "../docrepo"
git add -A
git commit -m "apidoc - generated at $(date)" 2>&1

if [ $? -eq 0 ]; then
	echo "commit successful, pushing..."
	git push origin gh-pages 2>&1
	exit 0
else
	echo "commit not successful... exiting"
	exit 1
fi
