import * as grpcWeb from 'grpc-web';

import * as fintekkers_models_util_lock_node_partition_pb from '../../../fintekkers/models/util/lock/node_partition_pb';
import * as fintekkers_models_util_lock_node_state_pb from '../../../fintekkers/models/util/lock/node_state_pb';
import * as fintekkers_requests_util_lock_lock_request_pb from '../../../fintekkers/requests/util/lock/lock_request_pb';
import * as fintekkers_requests_util_lock_lock_response_pb from '../../../fintekkers/requests/util/lock/lock_response_pb';
import * as fintekkers_services_lock$service_lock_service_pb from '../../../fintekkers/services/lock-service/lock_service_pb';
import * as google_protobuf_empty_pb from 'google-protobuf/google/protobuf/empty_pb';


export class LockClient {
  constructor (hostname: string,
               credentials?: null | { [index: string]: string; },
               options?: null | { [index: string]: any; });

  claimLock(
    request: fintekkers_requests_util_lock_lock_request_pb.LockRequestProto,
    metadata: grpcWeb.Metadata | undefined,
    callback: (err: grpcWeb.RpcError,
               response: fintekkers_requests_util_lock_lock_response_pb.LockResponseProto) => void
  ): grpcWeb.ClientReadableStream<fintekkers_requests_util_lock_lock_response_pb.LockResponseProto>;

  subscribeToLockUpdates(
    request: google_protobuf_empty_pb.Empty,
    metadata?: grpcWeb.Metadata
  ): grpcWeb.ClientReadableStream<fintekkers_models_util_lock_node_state_pb.NodeState>;

  listNamespaces(
    request: google_protobuf_empty_pb.Empty,
    metadata: grpcWeb.Metadata | undefined,
    callback: (err: grpcWeb.RpcError,
               response: fintekkers_services_lock$service_lock_service_pb.NamespaceList) => void
  ): grpcWeb.ClientReadableStream<fintekkers_services_lock$service_lock_service_pb.NamespaceList>;

  listPartitions(
    request: fintekkers_services_lock$service_lock_service_pb.NamespaceList,
    metadata: grpcWeb.Metadata | undefined,
    callback: (err: grpcWeb.RpcError,
               response: fintekkers_services_lock$service_lock_service_pb.PartitionsList) => void
  ): grpcWeb.ClientReadableStream<fintekkers_services_lock$service_lock_service_pb.PartitionsList>;

  getAllPartitionStatus(
    request: google_protobuf_empty_pb.Empty,
    metadata: grpcWeb.Metadata | undefined,
    callback: (err: grpcWeb.RpcError,
               response: fintekkers_services_lock$service_lock_service_pb.NodeStateList) => void
  ): grpcWeb.ClientReadableStream<fintekkers_services_lock$service_lock_service_pb.NodeStateList>;

  getPartitionStatus(
    request: fintekkers_models_util_lock_node_partition_pb.NodePartition,
    metadata: grpcWeb.Metadata | undefined,
    callback: (err: grpcWeb.RpcError,
               response: fintekkers_models_util_lock_node_state_pb.NodeState) => void
  ): grpcWeb.ClientReadableStream<fintekkers_models_util_lock_node_state_pb.NodeState>;

}

export class LockPromiseClient {
  constructor (hostname: string,
               credentials?: null | { [index: string]: string; },
               options?: null | { [index: string]: any; });

  claimLock(
    request: fintekkers_requests_util_lock_lock_request_pb.LockRequestProto,
    metadata?: grpcWeb.Metadata
  ): Promise<fintekkers_requests_util_lock_lock_response_pb.LockResponseProto>;

  subscribeToLockUpdates(
    request: google_protobuf_empty_pb.Empty,
    metadata?: grpcWeb.Metadata
  ): grpcWeb.ClientReadableStream<fintekkers_models_util_lock_node_state_pb.NodeState>;

  listNamespaces(
    request: google_protobuf_empty_pb.Empty,
    metadata?: grpcWeb.Metadata
  ): Promise<fintekkers_services_lock$service_lock_service_pb.NamespaceList>;

  listPartitions(
    request: fintekkers_services_lock$service_lock_service_pb.NamespaceList,
    metadata?: grpcWeb.Metadata
  ): Promise<fintekkers_services_lock$service_lock_service_pb.PartitionsList>;

  getAllPartitionStatus(
    request: google_protobuf_empty_pb.Empty,
    metadata?: grpcWeb.Metadata
  ): Promise<fintekkers_services_lock$service_lock_service_pb.NodeStateList>;

  getPartitionStatus(
    request: fintekkers_models_util_lock_node_partition_pb.NodePartition,
    metadata?: grpcWeb.Metadata
  ): Promise<fintekkers_models_util_lock_node_state_pb.NodeState>;

}

