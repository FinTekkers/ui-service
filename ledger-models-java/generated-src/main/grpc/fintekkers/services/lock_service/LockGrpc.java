package fintekkers.services.lock_service;

import static io.grpc.MethodDescriptor.generateFullMethodName;

/**
 */
@javax.annotation.Generated(
    value = "by gRPC proto compiler (version 1.51.0)",
    comments = "Source: fintekkers/services/lock-service/lock_service.proto")
@io.grpc.stub.annotations.GrpcGenerated
public final class LockGrpc {

  private LockGrpc() {}

  public static final String SERVICE_NAME = "fintekkers.services.lock_service.Lock";

  // Static method descriptors that strictly reflect the proto.
  private static volatile io.grpc.MethodDescriptor<fintekkers.requests.util.lock.LockRequestProto,
      fintekkers.requests.util.lock.LockResponseProto> getClaimLockMethod;

  @io.grpc.stub.annotations.RpcMethod(
      fullMethodName = SERVICE_NAME + '/' + "ClaimLock",
      requestType = fintekkers.requests.util.lock.LockRequestProto.class,
      responseType = fintekkers.requests.util.lock.LockResponseProto.class,
      methodType = io.grpc.MethodDescriptor.MethodType.UNARY)
  public static io.grpc.MethodDescriptor<fintekkers.requests.util.lock.LockRequestProto,
      fintekkers.requests.util.lock.LockResponseProto> getClaimLockMethod() {
    io.grpc.MethodDescriptor<fintekkers.requests.util.lock.LockRequestProto, fintekkers.requests.util.lock.LockResponseProto> getClaimLockMethod;
    if ((getClaimLockMethod = LockGrpc.getClaimLockMethod) == null) {
      synchronized (LockGrpc.class) {
        if ((getClaimLockMethod = LockGrpc.getClaimLockMethod) == null) {
          LockGrpc.getClaimLockMethod = getClaimLockMethod =
              io.grpc.MethodDescriptor.<fintekkers.requests.util.lock.LockRequestProto, fintekkers.requests.util.lock.LockResponseProto>newBuilder()
              .setType(io.grpc.MethodDescriptor.MethodType.UNARY)
              .setFullMethodName(generateFullMethodName(SERVICE_NAME, "ClaimLock"))
              .setSampledToLocalTracing(true)
              .setRequestMarshaller(io.grpc.protobuf.ProtoUtils.marshaller(
                  fintekkers.requests.util.lock.LockRequestProto.getDefaultInstance()))
              .setResponseMarshaller(io.grpc.protobuf.ProtoUtils.marshaller(
                  fintekkers.requests.util.lock.LockResponseProto.getDefaultInstance()))
              .setSchemaDescriptor(new LockMethodDescriptorSupplier("ClaimLock"))
              .build();
        }
      }
    }
    return getClaimLockMethod;
  }

  private static volatile io.grpc.MethodDescriptor<com.google.protobuf.Empty,
      fintekkers.services.lock_service.LockService.NamespaceList> getListNamespacesMethod;

  @io.grpc.stub.annotations.RpcMethod(
      fullMethodName = SERVICE_NAME + '/' + "ListNamespaces",
      requestType = com.google.protobuf.Empty.class,
      responseType = fintekkers.services.lock_service.LockService.NamespaceList.class,
      methodType = io.grpc.MethodDescriptor.MethodType.UNARY)
  public static io.grpc.MethodDescriptor<com.google.protobuf.Empty,
      fintekkers.services.lock_service.LockService.NamespaceList> getListNamespacesMethod() {
    io.grpc.MethodDescriptor<com.google.protobuf.Empty, fintekkers.services.lock_service.LockService.NamespaceList> getListNamespacesMethod;
    if ((getListNamespacesMethod = LockGrpc.getListNamespacesMethod) == null) {
      synchronized (LockGrpc.class) {
        if ((getListNamespacesMethod = LockGrpc.getListNamespacesMethod) == null) {
          LockGrpc.getListNamespacesMethod = getListNamespacesMethod =
              io.grpc.MethodDescriptor.<com.google.protobuf.Empty, fintekkers.services.lock_service.LockService.NamespaceList>newBuilder()
              .setType(io.grpc.MethodDescriptor.MethodType.UNARY)
              .setFullMethodName(generateFullMethodName(SERVICE_NAME, "ListNamespaces"))
              .setSampledToLocalTracing(true)
              .setRequestMarshaller(io.grpc.protobuf.ProtoUtils.marshaller(
                  com.google.protobuf.Empty.getDefaultInstance()))
              .setResponseMarshaller(io.grpc.protobuf.ProtoUtils.marshaller(
                  fintekkers.services.lock_service.LockService.NamespaceList.getDefaultInstance()))
              .setSchemaDescriptor(new LockMethodDescriptorSupplier("ListNamespaces"))
              .build();
        }
      }
    }
    return getListNamespacesMethod;
  }

  private static volatile io.grpc.MethodDescriptor<com.google.protobuf.Empty,
      fintekkers.services.lock_service.LockService.PartitionsList> getListPartitionsMethod;

  @io.grpc.stub.annotations.RpcMethod(
      fullMethodName = SERVICE_NAME + '/' + "ListPartitions",
      requestType = com.google.protobuf.Empty.class,
      responseType = fintekkers.services.lock_service.LockService.PartitionsList.class,
      methodType = io.grpc.MethodDescriptor.MethodType.UNARY)
  public static io.grpc.MethodDescriptor<com.google.protobuf.Empty,
      fintekkers.services.lock_service.LockService.PartitionsList> getListPartitionsMethod() {
    io.grpc.MethodDescriptor<com.google.protobuf.Empty, fintekkers.services.lock_service.LockService.PartitionsList> getListPartitionsMethod;
    if ((getListPartitionsMethod = LockGrpc.getListPartitionsMethod) == null) {
      synchronized (LockGrpc.class) {
        if ((getListPartitionsMethod = LockGrpc.getListPartitionsMethod) == null) {
          LockGrpc.getListPartitionsMethod = getListPartitionsMethod =
              io.grpc.MethodDescriptor.<com.google.protobuf.Empty, fintekkers.services.lock_service.LockService.PartitionsList>newBuilder()
              .setType(io.grpc.MethodDescriptor.MethodType.UNARY)
              .setFullMethodName(generateFullMethodName(SERVICE_NAME, "ListPartitions"))
              .setSampledToLocalTracing(true)
              .setRequestMarshaller(io.grpc.protobuf.ProtoUtils.marshaller(
                  com.google.protobuf.Empty.getDefaultInstance()))
              .setResponseMarshaller(io.grpc.protobuf.ProtoUtils.marshaller(
                  fintekkers.services.lock_service.LockService.PartitionsList.getDefaultInstance()))
              .setSchemaDescriptor(new LockMethodDescriptorSupplier("ListPartitions"))
              .build();
        }
      }
    }
    return getListPartitionsMethod;
  }

  private static volatile io.grpc.MethodDescriptor<fintekkers.models.util.lock.NodePartitionOuterClass.NodePartition,
      fintekkers.models.util.lock.NodeStateOuterClass.NodeState> getGetPartitionStatusMethod;

  @io.grpc.stub.annotations.RpcMethod(
      fullMethodName = SERVICE_NAME + '/' + "GetPartitionStatus",
      requestType = fintekkers.models.util.lock.NodePartitionOuterClass.NodePartition.class,
      responseType = fintekkers.models.util.lock.NodeStateOuterClass.NodeState.class,
      methodType = io.grpc.MethodDescriptor.MethodType.UNARY)
  public static io.grpc.MethodDescriptor<fintekkers.models.util.lock.NodePartitionOuterClass.NodePartition,
      fintekkers.models.util.lock.NodeStateOuterClass.NodeState> getGetPartitionStatusMethod() {
    io.grpc.MethodDescriptor<fintekkers.models.util.lock.NodePartitionOuterClass.NodePartition, fintekkers.models.util.lock.NodeStateOuterClass.NodeState> getGetPartitionStatusMethod;
    if ((getGetPartitionStatusMethod = LockGrpc.getGetPartitionStatusMethod) == null) {
      synchronized (LockGrpc.class) {
        if ((getGetPartitionStatusMethod = LockGrpc.getGetPartitionStatusMethod) == null) {
          LockGrpc.getGetPartitionStatusMethod = getGetPartitionStatusMethod =
              io.grpc.MethodDescriptor.<fintekkers.models.util.lock.NodePartitionOuterClass.NodePartition, fintekkers.models.util.lock.NodeStateOuterClass.NodeState>newBuilder()
              .setType(io.grpc.MethodDescriptor.MethodType.UNARY)
              .setFullMethodName(generateFullMethodName(SERVICE_NAME, "GetPartitionStatus"))
              .setSampledToLocalTracing(true)
              .setRequestMarshaller(io.grpc.protobuf.ProtoUtils.marshaller(
                  fintekkers.models.util.lock.NodePartitionOuterClass.NodePartition.getDefaultInstance()))
              .setResponseMarshaller(io.grpc.protobuf.ProtoUtils.marshaller(
                  fintekkers.models.util.lock.NodeStateOuterClass.NodeState.getDefaultInstance()))
              .setSchemaDescriptor(new LockMethodDescriptorSupplier("GetPartitionStatus"))
              .build();
        }
      }
    }
    return getGetPartitionStatusMethod;
  }

  /**
   * Creates a new async stub that supports all call types for the service
   */
  public static LockStub newStub(io.grpc.Channel channel) {
    io.grpc.stub.AbstractStub.StubFactory<LockStub> factory =
      new io.grpc.stub.AbstractStub.StubFactory<LockStub>() {
        @java.lang.Override
        public LockStub newStub(io.grpc.Channel channel, io.grpc.CallOptions callOptions) {
          return new LockStub(channel, callOptions);
        }
      };
    return LockStub.newStub(factory, channel);
  }

  /**
   * Creates a new blocking-style stub that supports unary and streaming output calls on the service
   */
  public static LockBlockingStub newBlockingStub(
      io.grpc.Channel channel) {
    io.grpc.stub.AbstractStub.StubFactory<LockBlockingStub> factory =
      new io.grpc.stub.AbstractStub.StubFactory<LockBlockingStub>() {
        @java.lang.Override
        public LockBlockingStub newStub(io.grpc.Channel channel, io.grpc.CallOptions callOptions) {
          return new LockBlockingStub(channel, callOptions);
        }
      };
    return LockBlockingStub.newStub(factory, channel);
  }

  /**
   * Creates a new ListenableFuture-style stub that supports unary calls on the service
   */
  public static LockFutureStub newFutureStub(
      io.grpc.Channel channel) {
    io.grpc.stub.AbstractStub.StubFactory<LockFutureStub> factory =
      new io.grpc.stub.AbstractStub.StubFactory<LockFutureStub>() {
        @java.lang.Override
        public LockFutureStub newStub(io.grpc.Channel channel, io.grpc.CallOptions callOptions) {
          return new LockFutureStub(channel, callOptions);
        }
      };
    return LockFutureStub.newStub(factory, channel);
  }

  /**
   */
  public static abstract class LockImplBase implements io.grpc.BindableService {

    /**
     * <pre>
     * Allows a Fintekkers service to claim the lock for a partition. 
     * See {fintekkers.request.util.lock.LockRequestProto} for details
     * </pre>
     */
    public void claimLock(fintekkers.requests.util.lock.LockRequestProto request,
        io.grpc.stub.StreamObserver<fintekkers.requests.util.lock.LockResponseProto> responseObserver) {
      io.grpc.stub.ServerCalls.asyncUnimplementedUnaryCall(getClaimLockMethod(), responseObserver);
    }

    /**
     * <pre>
     *In: Nothing
     *Out: just a list of strings?
     * </pre>
     */
    public void listNamespaces(com.google.protobuf.Empty request,
        io.grpc.stub.StreamObserver<fintekkers.services.lock_service.LockService.NamespaceList> responseObserver) {
      io.grpc.stub.ServerCalls.asyncUnimplementedUnaryCall(getListNamespacesMethod(), responseObserver);
    }

    /**
     * <pre>
     *In: namespace string
     *OUt: just a list of parition ids?
     * </pre>
     */
    public void listPartitions(com.google.protobuf.Empty request,
        io.grpc.stub.StreamObserver<fintekkers.services.lock_service.LockService.PartitionsList> responseObserver) {
      io.grpc.stub.ServerCalls.asyncUnimplementedUnaryCall(getListPartitionsMethod(), responseObserver);
    }

    /**
     * <pre>
     *In namespace / parition
     * </pre>
     */
    public void getPartitionStatus(fintekkers.models.util.lock.NodePartitionOuterClass.NodePartition request,
        io.grpc.stub.StreamObserver<fintekkers.models.util.lock.NodeStateOuterClass.NodeState> responseObserver) {
      io.grpc.stub.ServerCalls.asyncUnimplementedUnaryCall(getGetPartitionStatusMethod(), responseObserver);
    }

    @java.lang.Override public final io.grpc.ServerServiceDefinition bindService() {
      return io.grpc.ServerServiceDefinition.builder(getServiceDescriptor())
          .addMethod(
            getClaimLockMethod(),
            io.grpc.stub.ServerCalls.asyncUnaryCall(
              new MethodHandlers<
                fintekkers.requests.util.lock.LockRequestProto,
                fintekkers.requests.util.lock.LockResponseProto>(
                  this, METHODID_CLAIM_LOCK)))
          .addMethod(
            getListNamespacesMethod(),
            io.grpc.stub.ServerCalls.asyncUnaryCall(
              new MethodHandlers<
                com.google.protobuf.Empty,
                fintekkers.services.lock_service.LockService.NamespaceList>(
                  this, METHODID_LIST_NAMESPACES)))
          .addMethod(
            getListPartitionsMethod(),
            io.grpc.stub.ServerCalls.asyncUnaryCall(
              new MethodHandlers<
                com.google.protobuf.Empty,
                fintekkers.services.lock_service.LockService.PartitionsList>(
                  this, METHODID_LIST_PARTITIONS)))
          .addMethod(
            getGetPartitionStatusMethod(),
            io.grpc.stub.ServerCalls.asyncUnaryCall(
              new MethodHandlers<
                fintekkers.models.util.lock.NodePartitionOuterClass.NodePartition,
                fintekkers.models.util.lock.NodeStateOuterClass.NodeState>(
                  this, METHODID_GET_PARTITION_STATUS)))
          .build();
    }
  }

  /**
   */
  public static final class LockStub extends io.grpc.stub.AbstractAsyncStub<LockStub> {
    private LockStub(
        io.grpc.Channel channel, io.grpc.CallOptions callOptions) {
      super(channel, callOptions);
    }

    @java.lang.Override
    protected LockStub build(
        io.grpc.Channel channel, io.grpc.CallOptions callOptions) {
      return new LockStub(channel, callOptions);
    }

    /**
     * <pre>
     * Allows a Fintekkers service to claim the lock for a partition. 
     * See {fintekkers.request.util.lock.LockRequestProto} for details
     * </pre>
     */
    public void claimLock(fintekkers.requests.util.lock.LockRequestProto request,
        io.grpc.stub.StreamObserver<fintekkers.requests.util.lock.LockResponseProto> responseObserver) {
      io.grpc.stub.ClientCalls.asyncUnaryCall(
          getChannel().newCall(getClaimLockMethod(), getCallOptions()), request, responseObserver);
    }

    /**
     * <pre>
     *In: Nothing
     *Out: just a list of strings?
     * </pre>
     */
    public void listNamespaces(com.google.protobuf.Empty request,
        io.grpc.stub.StreamObserver<fintekkers.services.lock_service.LockService.NamespaceList> responseObserver) {
      io.grpc.stub.ClientCalls.asyncUnaryCall(
          getChannel().newCall(getListNamespacesMethod(), getCallOptions()), request, responseObserver);
    }

    /**
     * <pre>
     *In: namespace string
     *OUt: just a list of parition ids?
     * </pre>
     */
    public void listPartitions(com.google.protobuf.Empty request,
        io.grpc.stub.StreamObserver<fintekkers.services.lock_service.LockService.PartitionsList> responseObserver) {
      io.grpc.stub.ClientCalls.asyncUnaryCall(
          getChannel().newCall(getListPartitionsMethod(), getCallOptions()), request, responseObserver);
    }

    /**
     * <pre>
     *In namespace / parition
     * </pre>
     */
    public void getPartitionStatus(fintekkers.models.util.lock.NodePartitionOuterClass.NodePartition request,
        io.grpc.stub.StreamObserver<fintekkers.models.util.lock.NodeStateOuterClass.NodeState> responseObserver) {
      io.grpc.stub.ClientCalls.asyncUnaryCall(
          getChannel().newCall(getGetPartitionStatusMethod(), getCallOptions()), request, responseObserver);
    }
  }

  /**
   */
  public static final class LockBlockingStub extends io.grpc.stub.AbstractBlockingStub<LockBlockingStub> {
    private LockBlockingStub(
        io.grpc.Channel channel, io.grpc.CallOptions callOptions) {
      super(channel, callOptions);
    }

    @java.lang.Override
    protected LockBlockingStub build(
        io.grpc.Channel channel, io.grpc.CallOptions callOptions) {
      return new LockBlockingStub(channel, callOptions);
    }

    /**
     * <pre>
     * Allows a Fintekkers service to claim the lock for a partition. 
     * See {fintekkers.request.util.lock.LockRequestProto} for details
     * </pre>
     */
    public fintekkers.requests.util.lock.LockResponseProto claimLock(fintekkers.requests.util.lock.LockRequestProto request) {
      return io.grpc.stub.ClientCalls.blockingUnaryCall(
          getChannel(), getClaimLockMethod(), getCallOptions(), request);
    }

    /**
     * <pre>
     *In: Nothing
     *Out: just a list of strings?
     * </pre>
     */
    public fintekkers.services.lock_service.LockService.NamespaceList listNamespaces(com.google.protobuf.Empty request) {
      return io.grpc.stub.ClientCalls.blockingUnaryCall(
          getChannel(), getListNamespacesMethod(), getCallOptions(), request);
    }

    /**
     * <pre>
     *In: namespace string
     *OUt: just a list of parition ids?
     * </pre>
     */
    public fintekkers.services.lock_service.LockService.PartitionsList listPartitions(com.google.protobuf.Empty request) {
      return io.grpc.stub.ClientCalls.blockingUnaryCall(
          getChannel(), getListPartitionsMethod(), getCallOptions(), request);
    }

    /**
     * <pre>
     *In namespace / parition
     * </pre>
     */
    public fintekkers.models.util.lock.NodeStateOuterClass.NodeState getPartitionStatus(fintekkers.models.util.lock.NodePartitionOuterClass.NodePartition request) {
      return io.grpc.stub.ClientCalls.blockingUnaryCall(
          getChannel(), getGetPartitionStatusMethod(), getCallOptions(), request);
    }
  }

  /**
   */
  public static final class LockFutureStub extends io.grpc.stub.AbstractFutureStub<LockFutureStub> {
    private LockFutureStub(
        io.grpc.Channel channel, io.grpc.CallOptions callOptions) {
      super(channel, callOptions);
    }

    @java.lang.Override
    protected LockFutureStub build(
        io.grpc.Channel channel, io.grpc.CallOptions callOptions) {
      return new LockFutureStub(channel, callOptions);
    }

    /**
     * <pre>
     * Allows a Fintekkers service to claim the lock for a partition. 
     * See {fintekkers.request.util.lock.LockRequestProto} for details
     * </pre>
     */
    public com.google.common.util.concurrent.ListenableFuture<fintekkers.requests.util.lock.LockResponseProto> claimLock(
        fintekkers.requests.util.lock.LockRequestProto request) {
      return io.grpc.stub.ClientCalls.futureUnaryCall(
          getChannel().newCall(getClaimLockMethod(), getCallOptions()), request);
    }

    /**
     * <pre>
     *In: Nothing
     *Out: just a list of strings?
     * </pre>
     */
    public com.google.common.util.concurrent.ListenableFuture<fintekkers.services.lock_service.LockService.NamespaceList> listNamespaces(
        com.google.protobuf.Empty request) {
      return io.grpc.stub.ClientCalls.futureUnaryCall(
          getChannel().newCall(getListNamespacesMethod(), getCallOptions()), request);
    }

    /**
     * <pre>
     *In: namespace string
     *OUt: just a list of parition ids?
     * </pre>
     */
    public com.google.common.util.concurrent.ListenableFuture<fintekkers.services.lock_service.LockService.PartitionsList> listPartitions(
        com.google.protobuf.Empty request) {
      return io.grpc.stub.ClientCalls.futureUnaryCall(
          getChannel().newCall(getListPartitionsMethod(), getCallOptions()), request);
    }

    /**
     * <pre>
     *In namespace / parition
     * </pre>
     */
    public com.google.common.util.concurrent.ListenableFuture<fintekkers.models.util.lock.NodeStateOuterClass.NodeState> getPartitionStatus(
        fintekkers.models.util.lock.NodePartitionOuterClass.NodePartition request) {
      return io.grpc.stub.ClientCalls.futureUnaryCall(
          getChannel().newCall(getGetPartitionStatusMethod(), getCallOptions()), request);
    }
  }

  private static final int METHODID_CLAIM_LOCK = 0;
  private static final int METHODID_LIST_NAMESPACES = 1;
  private static final int METHODID_LIST_PARTITIONS = 2;
  private static final int METHODID_GET_PARTITION_STATUS = 3;

  private static final class MethodHandlers<Req, Resp> implements
      io.grpc.stub.ServerCalls.UnaryMethod<Req, Resp>,
      io.grpc.stub.ServerCalls.ServerStreamingMethod<Req, Resp>,
      io.grpc.stub.ServerCalls.ClientStreamingMethod<Req, Resp>,
      io.grpc.stub.ServerCalls.BidiStreamingMethod<Req, Resp> {
    private final LockImplBase serviceImpl;
    private final int methodId;

    MethodHandlers(LockImplBase serviceImpl, int methodId) {
      this.serviceImpl = serviceImpl;
      this.methodId = methodId;
    }

    @java.lang.Override
    @java.lang.SuppressWarnings("unchecked")
    public void invoke(Req request, io.grpc.stub.StreamObserver<Resp> responseObserver) {
      switch (methodId) {
        case METHODID_CLAIM_LOCK:
          serviceImpl.claimLock((fintekkers.requests.util.lock.LockRequestProto) request,
              (io.grpc.stub.StreamObserver<fintekkers.requests.util.lock.LockResponseProto>) responseObserver);
          break;
        case METHODID_LIST_NAMESPACES:
          serviceImpl.listNamespaces((com.google.protobuf.Empty) request,
              (io.grpc.stub.StreamObserver<fintekkers.services.lock_service.LockService.NamespaceList>) responseObserver);
          break;
        case METHODID_LIST_PARTITIONS:
          serviceImpl.listPartitions((com.google.protobuf.Empty) request,
              (io.grpc.stub.StreamObserver<fintekkers.services.lock_service.LockService.PartitionsList>) responseObserver);
          break;
        case METHODID_GET_PARTITION_STATUS:
          serviceImpl.getPartitionStatus((fintekkers.models.util.lock.NodePartitionOuterClass.NodePartition) request,
              (io.grpc.stub.StreamObserver<fintekkers.models.util.lock.NodeStateOuterClass.NodeState>) responseObserver);
          break;
        default:
          throw new AssertionError();
      }
    }

    @java.lang.Override
    @java.lang.SuppressWarnings("unchecked")
    public io.grpc.stub.StreamObserver<Req> invoke(
        io.grpc.stub.StreamObserver<Resp> responseObserver) {
      switch (methodId) {
        default:
          throw new AssertionError();
      }
    }
  }

  private static abstract class LockBaseDescriptorSupplier
      implements io.grpc.protobuf.ProtoFileDescriptorSupplier, io.grpc.protobuf.ProtoServiceDescriptorSupplier {
    LockBaseDescriptorSupplier() {}

    @java.lang.Override
    public com.google.protobuf.Descriptors.FileDescriptor getFileDescriptor() {
      return fintekkers.services.lock_service.LockService.getDescriptor();
    }

    @java.lang.Override
    public com.google.protobuf.Descriptors.ServiceDescriptor getServiceDescriptor() {
      return getFileDescriptor().findServiceByName("Lock");
    }
  }

  private static final class LockFileDescriptorSupplier
      extends LockBaseDescriptorSupplier {
    LockFileDescriptorSupplier() {}
  }

  private static final class LockMethodDescriptorSupplier
      extends LockBaseDescriptorSupplier
      implements io.grpc.protobuf.ProtoMethodDescriptorSupplier {
    private final String methodName;

    LockMethodDescriptorSupplier(String methodName) {
      this.methodName = methodName;
    }

    @java.lang.Override
    public com.google.protobuf.Descriptors.MethodDescriptor getMethodDescriptor() {
      return getServiceDescriptor().findMethodByName(methodName);
    }
  }

  private static volatile io.grpc.ServiceDescriptor serviceDescriptor;

  public static io.grpc.ServiceDescriptor getServiceDescriptor() {
    io.grpc.ServiceDescriptor result = serviceDescriptor;
    if (result == null) {
      synchronized (LockGrpc.class) {
        result = serviceDescriptor;
        if (result == null) {
          serviceDescriptor = result = io.grpc.ServiceDescriptor.newBuilder(SERVICE_NAME)
              .setSchemaDescriptor(new LockFileDescriptorSupplier())
              .addMethod(getClaimLockMethod())
              .addMethod(getListNamespacesMethod())
              .addMethod(getListPartitionsMethod())
              .addMethod(getGetPartitionStatusMethod())
              .build();
        }
      }
    }
    return result;
  }
}
