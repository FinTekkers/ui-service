// GENERATED CODE -- DO NOT EDIT!

'use strict';
var grpc = require('@grpc/grpc-js');
var fintekkers_services_lock$service_lock_service_pb = require('../../../fintekkers/services/lock-service/lock_service_pb.js');
var google_protobuf_empty_pb = require('google-protobuf/google/protobuf/empty_pb.js');
var fintekkers_requests_util_lock_lock_request_pb = require('../../../fintekkers/requests/util/lock/lock_request_pb.js');
var fintekkers_requests_util_lock_lock_response_pb = require('../../../fintekkers/requests/util/lock/lock_response_pb.js');
var fintekkers_models_util_lock_node_partition_pb = require('../../../fintekkers/models/util/lock/node_partition_pb.js');
var fintekkers_models_util_lock_node_state_pb = require('../../../fintekkers/models/util/lock/node_state_pb.js');

function serialize_fintekkers_models_util_lock_NodePartition(arg) {
  if (!(arg instanceof fintekkers_models_util_lock_node_partition_pb.NodePartition)) {
    throw new Error('Expected argument of type fintekkers.models.util.lock.NodePartition');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_fintekkers_models_util_lock_NodePartition(buffer_arg) {
  return fintekkers_models_util_lock_node_partition_pb.NodePartition.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_fintekkers_models_util_lock_NodeState(arg) {
  if (!(arg instanceof fintekkers_models_util_lock_node_state_pb.NodeState)) {
    throw new Error('Expected argument of type fintekkers.models.util.lock.NodeState');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_fintekkers_models_util_lock_NodeState(buffer_arg) {
  return fintekkers_models_util_lock_node_state_pb.NodeState.deserializeBinary(new Uint8Array(buffer_arg));
}

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

function serialize_fintekkers_services_lock_service_NamespaceList(arg) {
  if (!(arg instanceof fintekkers_services_lock$service_lock_service_pb.NamespaceList)) {
    throw new Error('Expected argument of type fintekkers.services.lock_service.NamespaceList');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_fintekkers_services_lock_service_NamespaceList(buffer_arg) {
  return fintekkers_services_lock$service_lock_service_pb.NamespaceList.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_fintekkers_services_lock_service_PartitionsList(arg) {
  if (!(arg instanceof fintekkers_services_lock$service_lock_service_pb.PartitionsList)) {
    throw new Error('Expected argument of type fintekkers.services.lock_service.PartitionsList');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_fintekkers_services_lock_service_PartitionsList(buffer_arg) {
  return fintekkers_services_lock$service_lock_service_pb.PartitionsList.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_google_protobuf_Empty(arg) {
  if (!(arg instanceof google_protobuf_empty_pb.Empty)) {
    throw new Error('Expected argument of type google.protobuf.Empty');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_google_protobuf_Empty(buffer_arg) {
  return google_protobuf_empty_pb.Empty.deserializeBinary(new Uint8Array(buffer_arg));
}


var LockService = exports.LockService = {
  // Allows a Fintekkers service to claim the lock for a partition. 
// See {fintekkers.request.util.lock.LockRequestProto} for details
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
  // In: Nothing
// Out: just a list of strings?
listNamespaces: {
    path: '/fintekkers.services.lock_service.Lock/ListNamespaces',
    requestStream: false,
    responseStream: false,
    requestType: google_protobuf_empty_pb.Empty,
    responseType: fintekkers_services_lock$service_lock_service_pb.NamespaceList,
    requestSerialize: serialize_google_protobuf_Empty,
    requestDeserialize: deserialize_google_protobuf_Empty,
    responseSerialize: serialize_fintekkers_services_lock_service_NamespaceList,
    responseDeserialize: deserialize_fintekkers_services_lock_service_NamespaceList,
  },
  // In: namespace string
// OUt: just a list of parition ids?
listPartitions: {
    path: '/fintekkers.services.lock_service.Lock/ListPartitions',
    requestStream: false,
    responseStream: false,
    requestType: google_protobuf_empty_pb.Empty,
    responseType: fintekkers_services_lock$service_lock_service_pb.PartitionsList,
    requestSerialize: serialize_google_protobuf_Empty,
    requestDeserialize: deserialize_google_protobuf_Empty,
    responseSerialize: serialize_fintekkers_services_lock_service_PartitionsList,
    responseDeserialize: deserialize_fintekkers_services_lock_service_PartitionsList,
  },
  // In namespace / parition
getPartitionStatus: {
    path: '/fintekkers.services.lock_service.Lock/GetPartitionStatus',
    requestStream: false,
    responseStream: false,
    requestType: fintekkers_models_util_lock_node_partition_pb.NodePartition,
    responseType: fintekkers_models_util_lock_node_state_pb.NodeState,
    requestSerialize: serialize_fintekkers_models_util_lock_NodePartition,
    requestDeserialize: deserialize_fintekkers_models_util_lock_NodePartition,
    responseSerialize: serialize_fintekkers_models_util_lock_NodeState,
    responseDeserialize: deserialize_fintekkers_models_util_lock_NodeState,
  },
};

exports.LockClient = grpc.makeGenericClientConstructor(LockService);
