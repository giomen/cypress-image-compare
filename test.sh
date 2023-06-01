#!/bin/sh

set -e

npm install
npm run jest
npm run lint
npm run prettier:check
npm run build
cd docker
rm -rf dist
mv ../dist dist

if [ -z "${1}" ]
then
  docker build -t cypress-screenshot-compare .
else
  docker build --build-arg CYPRESS_VERSION=$1 -t cypress-screenshot-compare .
fi

docker run -d --name cypress-test cypress-screenshot-compare sleep infinity
docker exec cypress-test bash -c './node_modules/.bin/cypress run --env type=base'
docker exec cypress-test bash -c './node_modules/.bin/cypress run --env type=actual'
docker rm -f cypress-test
