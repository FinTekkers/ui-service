// Generated by the protocol buffer compiler.  DO NOT EDIT!
// source: requests/util/lock/lock_response.proto

package common.util.lock;

public final class LockResponseProtos {
  private LockResponseProtos() {}
  public static void registerAllExtensions(
      com.google.protobuf.ExtensionRegistryLite registry) {
  }

  public static void registerAllExtensions(
      com.google.protobuf.ExtensionRegistry registry) {
    registerAllExtensions(
        (com.google.protobuf.ExtensionRegistryLite) registry);
  }
  static final com.google.protobuf.Descriptors.Descriptor
    internal_static_util_lock_TransactionResponseProto_descriptor;
  static final 
    com.google.protobuf.GeneratedMessageV3.FieldAccessorTable
      internal_static_util_lock_TransactionResponseProto_fieldAccessorTable;

  public static com.google.protobuf.Descriptors.FileDescriptor
      getDescriptor() {
    return descriptor;
  }
  private static  com.google.protobuf.Descriptors.FileDescriptor
      descriptor;
  static {
    java.lang.String[] descriptorData = {
      "\n&requests/util/lock/lock_response.proto" +
      "\022\tutil.lock\032!models/util/lock/node_state" +
      ".proto\032%requests/util/lock/lock_request." +
      "proto\"\255\001\n\030TransactionResponseProto\022\024\n\014ob" +
      "ject_class\030\001 \001(\t\022\017\n\007version\030\002 \001(\t\0228\n\023cre" +
      "ate_lock_request\030\003 \001(\0132\033.util.lock.LockR" +
      "equestProto\0220\n\rlock_response\030\004 \001(\0132\031.uti" +
      "l.lock.NodeStateProtoB(\n\020common.util.loc" +
      "kB\022LockResponseProtosP\001b\006proto3"
    };
    descriptor = com.google.protobuf.Descriptors.FileDescriptor
      .internalBuildGeneratedFileFrom(descriptorData,
        new com.google.protobuf.Descriptors.FileDescriptor[] {
          common.locks.NodeStateProtos.getDescriptor(),
          common.util.lock.LockRequestProtos.getDescriptor(),
        });
    internal_static_util_lock_TransactionResponseProto_descriptor =
      getDescriptor().getMessageTypes().get(0);
    internal_static_util_lock_TransactionResponseProto_fieldAccessorTable = new
      com.google.protobuf.GeneratedMessageV3.FieldAccessorTable(
        internal_static_util_lock_TransactionResponseProto_descriptor,
        new java.lang.String[] { "ObjectClass", "Version", "CreateLockRequest", "LockResponse", });
    common.locks.NodeStateProtos.getDescriptor();
    common.util.lock.LockRequestProtos.getDescriptor();
  }

  // @@protoc_insertion_point(outer_class_scope)
}