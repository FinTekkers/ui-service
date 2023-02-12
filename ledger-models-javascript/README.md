you must download the web extension 

brew install protobuf@3
brew link --overwrite protobuf@3

brew install protoc-gen-grpc-web


see more at https://github.com/grpc/grpc-web

to publish you must make a .npmrc file that containst the following 

@USERNAME:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=TOKEN


if using web grpc from the browser a proxy like Envoy or a server that that supports web grpc must be used