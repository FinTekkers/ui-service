// GENERATED CODE -- DO NOT EDIT!

'use strict';
var grpc = require('@grpc/grpc-js');
var fintekkers_requests_util_lock_lock_request_pb = require('../../../fintekkers/requests/util/lock/lock_request_pb.js');
var fintekkers_requests_util_lock_lock_response_pb = require('../../../fintekkers/requests/util/lock/lock_response_pb.js');

function serialize_fintekkers_requests_util_lock_LockRequestProto(arg) {
  if (!(arg instanceof fintekkers_requests_util_lock_lock_request_pb.LockRequestProto)) {
    throw new Error('Expected argument of type fintekkers.requests.util.lock.LockRequestProto');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_fintekkers_requests_util_lock_LockRequestProto(buffer_arg) {
  return fintekkers_requests_util_lock_lock_request_pb.LockRequestProto.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_fintekkers_requests_util_lock_LockResponseProto(arg) {
  if (!(arg instanceof fintekkers_requests_util_lock_lock_response_pb.LockResponseProto)) {
    throw new Error('Expected argument of type fintekkers.requests.util.lock.LockResponseProto');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_fintekkers_requests_util_lock_LockResponseProto(buffer_arg) {
  return fintekkers_requests_util_lock_lock_response_pb.LockResponseProto.deserializeBinary(new Uint8Array(buffer_arg));
}


var LockService = exports.LockService = {
  claimLock: {
    path: '/fintekkers.services.lock_service.Lock/ClaimLock',
    requestStream: false,
    responseStream: false,
    requestType: fintekkers_requests_util_lock_lock_request_pb.LockRequestProto,
    responseType: fintekkers_requests_util_lock_lock_response_pb.LockResponseProto,
    requestSerialize: serialize_fintekkers_requests_util_lock_LockRequestProto,
    requestDeserialize: deserialize_fintekkers_requests_util_lock_LockRequestProto,
    responseSerialize: serialize_fintekkers_requests_util_lock_LockResponseProto,
    responseDeserialize: deserialize_fintekkers_requests_util_lock_LockResponseProto,
  },
};

exports.LockClient = grpc.makeGenericClientConstructor(LockService);
