#!/bin/bash

set -e

git fetch https://github.com/kiki-core-stack/pack main
git merge FETCH_HEAD
