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
     */
    public void claimLock(fintekkers.requests.util.lock.LockRequestProto request,
        io.grpc.stub.StreamObserver<fintekkers.requests.util.lock.LockResponseProto> responseObserver) {
      io.grpc.stub.ServerCalls.asyncUnimplementedUnaryCall(getClaimLockMethod(), responseObserver);
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
     */
    public void claimLock(fintekkers.requests.util.lock.LockRequestProto request,
        io.grpc.stub.StreamObserver<fintekkers.requests.util.lock.LockResponseProto> responseObserver) {
      io.grpc.stub.ClientCalls.asyncUnaryCall(
          getChannel().newCall(getClaimLockMethod(), getCallOptions()), request, responseObserver);
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
     */
    public fintekkers.requests.util.lock.LockResponseProto claimLock(fintekkers.requests.util.lock.LockRequestProto request) {
      return io.grpc.stub.ClientCalls.blockingUnaryCall(
          getChannel(), getClaimLockMethod(), getCallOptions(), request);
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
     */
    public com.google.common.util.concurrent.ListenableFuture<fintekkers.requests.util.lock.LockResponseProto> claimLock(
        fintekkers.requests.util.lock.LockRequestProto request) {
      return io.grpc.stub.ClientCalls.futureUnaryCall(
          getChannel().newCall(getClaimLockMethod(), getCallOptions()), request);
    }
  }

  private static final int METHODID_CLAIM_LOCK = 0;

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
              .build();
        }
      }
    }
    return result;
  }
}
