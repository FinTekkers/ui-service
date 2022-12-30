package common.service;

import static io.grpc.MethodDescriptor.generateFullMethodName;

/**
 */
@javax.annotation.Generated(
    value = "by gRPC proto compiler (version 1.51.0)",
    comments = "Source: services/valuation-service/valuation_service.proto")
@io.grpc.stub.annotations.GrpcGenerated
public final class ValuationGrpc {

  private ValuationGrpc() {}

  public static final String SERVICE_NAME = "valuation_service.Valuation";

  // Static method descriptors that strictly reflect the proto.
  private static volatile io.grpc.MethodDescriptor<common.request.ValuationRequestProto,
      common.request.ValuationResponseProto> getRunValuationMethod;

  @io.grpc.stub.annotations.RpcMethod(
      fullMethodName = SERVICE_NAME + '/' + "RunValuation",
      requestType = common.request.ValuationRequestProto.class,
      responseType = common.request.ValuationResponseProto.class,
      methodType = io.grpc.MethodDescriptor.MethodType.UNARY)
  public static io.grpc.MethodDescriptor<common.request.ValuationRequestProto,
      common.request.ValuationResponseProto> getRunValuationMethod() {
    io.grpc.MethodDescriptor<common.request.ValuationRequestProto, common.request.ValuationResponseProto> getRunValuationMethod;
    if ((getRunValuationMethod = ValuationGrpc.getRunValuationMethod) == null) {
      synchronized (ValuationGrpc.class) {
        if ((getRunValuationMethod = ValuationGrpc.getRunValuationMethod) == null) {
          ValuationGrpc.getRunValuationMethod = getRunValuationMethod =
              io.grpc.MethodDescriptor.<common.request.ValuationRequestProto, common.request.ValuationResponseProto>newBuilder()
              .setType(io.grpc.MethodDescriptor.MethodType.UNARY)
              .setFullMethodName(generateFullMethodName(SERVICE_NAME, "RunValuation"))
              .setSampledToLocalTracing(true)
              .setRequestMarshaller(io.grpc.protobuf.ProtoUtils.marshaller(
                  common.request.ValuationRequestProto.getDefaultInstance()))
              .setResponseMarshaller(io.grpc.protobuf.ProtoUtils.marshaller(
                  common.request.ValuationResponseProto.getDefaultInstance()))
              .setSchemaDescriptor(new ValuationMethodDescriptorSupplier("RunValuation"))
              .build();
        }
      }
    }
    return getRunValuationMethod;
  }

  /**
   * Creates a new async stub that supports all call types for the service
   */
  public static ValuationStub newStub(io.grpc.Channel channel) {
    io.grpc.stub.AbstractStub.StubFactory<ValuationStub> factory =
      new io.grpc.stub.AbstractStub.StubFactory<ValuationStub>() {
        @java.lang.Override
        public ValuationStub newStub(io.grpc.Channel channel, io.grpc.CallOptions callOptions) {
          return new ValuationStub(channel, callOptions);
        }
      };
    return ValuationStub.newStub(factory, channel);
  }

  /**
   * Creates a new blocking-style stub that supports unary and streaming output calls on the service
   */
  public static ValuationBlockingStub newBlockingStub(
      io.grpc.Channel channel) {
    io.grpc.stub.AbstractStub.StubFactory<ValuationBlockingStub> factory =
      new io.grpc.stub.AbstractStub.StubFactory<ValuationBlockingStub>() {
        @java.lang.Override
        public ValuationBlockingStub newStub(io.grpc.Channel channel, io.grpc.CallOptions callOptions) {
          return new ValuationBlockingStub(channel, callOptions);
        }
      };
    return ValuationBlockingStub.newStub(factory, channel);
  }

  /**
   * Creates a new ListenableFuture-style stub that supports unary calls on the service
   */
  public static ValuationFutureStub newFutureStub(
      io.grpc.Channel channel) {
    io.grpc.stub.AbstractStub.StubFactory<ValuationFutureStub> factory =
      new io.grpc.stub.AbstractStub.StubFactory<ValuationFutureStub>() {
        @java.lang.Override
        public ValuationFutureStub newStub(io.grpc.Channel channel, io.grpc.CallOptions callOptions) {
          return new ValuationFutureStub(channel, callOptions);
        }
      };
    return ValuationFutureStub.newStub(factory, channel);
  }

  /**
   */
  public static abstract class ValuationImplBase implements io.grpc.BindableService {

    /**
     */
    public void runValuation(common.request.ValuationRequestProto request,
        io.grpc.stub.StreamObserver<common.request.ValuationResponseProto> responseObserver) {
      io.grpc.stub.ServerCalls.asyncUnimplementedUnaryCall(getRunValuationMethod(), responseObserver);
    }

    @java.lang.Override public final io.grpc.ServerServiceDefinition bindService() {
      return io.grpc.ServerServiceDefinition.builder(getServiceDescriptor())
          .addMethod(
            getRunValuationMethod(),
            io.grpc.stub.ServerCalls.asyncUnaryCall(
              new MethodHandlers<
                common.request.ValuationRequestProto,
                common.request.ValuationResponseProto>(
                  this, METHODID_RUN_VALUATION)))
          .build();
    }
  }

  /**
   */
  public static final class ValuationStub extends io.grpc.stub.AbstractAsyncStub<ValuationStub> {
    private ValuationStub(
        io.grpc.Channel channel, io.grpc.CallOptions callOptions) {
      super(channel, callOptions);
    }

    @java.lang.Override
    protected ValuationStub build(
        io.grpc.Channel channel, io.grpc.CallOptions callOptions) {
      return new ValuationStub(channel, callOptions);
    }

    /**
     */
    public void runValuation(common.request.ValuationRequestProto request,
        io.grpc.stub.StreamObserver<common.request.ValuationResponseProto> responseObserver) {
      io.grpc.stub.ClientCalls.asyncUnaryCall(
          getChannel().newCall(getRunValuationMethod(), getCallOptions()), request, responseObserver);
    }
  }

  /**
   */
  public static final class ValuationBlockingStub extends io.grpc.stub.AbstractBlockingStub<ValuationBlockingStub> {
    private ValuationBlockingStub(
        io.grpc.Channel channel, io.grpc.CallOptions callOptions) {
      super(channel, callOptions);
    }

    @java.lang.Override
    protected ValuationBlockingStub build(
        io.grpc.Channel channel, io.grpc.CallOptions callOptions) {
      return new ValuationBlockingStub(channel, callOptions);
    }

    /**
     */
    public common.request.ValuationResponseProto runValuation(common.request.ValuationRequestProto request) {
      return io.grpc.stub.ClientCalls.blockingUnaryCall(
          getChannel(), getRunValuationMethod(), getCallOptions(), request);
    }
  }

  /**
   */
  public static final class ValuationFutureStub extends io.grpc.stub.AbstractFutureStub<ValuationFutureStub> {
    private ValuationFutureStub(
        io.grpc.Channel channel, io.grpc.CallOptions callOptions) {
      super(channel, callOptions);
    }

    @java.lang.Override
    protected ValuationFutureStub build(
        io.grpc.Channel channel, io.grpc.CallOptions callOptions) {
      return new ValuationFutureStub(channel, callOptions);
    }

    /**
     */
    public com.google.common.util.concurrent.ListenableFuture<common.request.ValuationResponseProto> runValuation(
        common.request.ValuationRequestProto request) {
      return io.grpc.stub.ClientCalls.futureUnaryCall(
          getChannel().newCall(getRunValuationMethod(), getCallOptions()), request);
    }
  }

  private static final int METHODID_RUN_VALUATION = 0;

  private static final class MethodHandlers<Req, Resp> implements
      io.grpc.stub.ServerCalls.UnaryMethod<Req, Resp>,
      io.grpc.stub.ServerCalls.ServerStreamingMethod<Req, Resp>,
      io.grpc.stub.ServerCalls.ClientStreamingMethod<Req, Resp>,
      io.grpc.stub.ServerCalls.BidiStreamingMethod<Req, Resp> {
    private final ValuationImplBase serviceImpl;
    private final int methodId;

    MethodHandlers(ValuationImplBase serviceImpl, int methodId) {
      this.serviceImpl = serviceImpl;
      this.methodId = methodId;
    }

    @java.lang.Override
    @java.lang.SuppressWarnings("unchecked")
    public void invoke(Req request, io.grpc.stub.StreamObserver<Resp> responseObserver) {
      switch (methodId) {
        case METHODID_RUN_VALUATION:
          serviceImpl.runValuation((common.request.ValuationRequestProto) request,
              (io.grpc.stub.StreamObserver<common.request.ValuationResponseProto>) responseObserver);
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

  private static abstract class ValuationBaseDescriptorSupplier
      implements io.grpc.protobuf.ProtoFileDescriptorSupplier, io.grpc.protobuf.ProtoServiceDescriptorSupplier {
    ValuationBaseDescriptorSupplier() {}

    @java.lang.Override
    public com.google.protobuf.Descriptors.FileDescriptor getFileDescriptor() {
      return common.service.ValuationService.getDescriptor();
    }

    @java.lang.Override
    public com.google.protobuf.Descriptors.ServiceDescriptor getServiceDescriptor() {
      return getFileDescriptor().findServiceByName("Valuation");
    }
  }

  private static final class ValuationFileDescriptorSupplier
      extends ValuationBaseDescriptorSupplier {
    ValuationFileDescriptorSupplier() {}
  }

  private static final class ValuationMethodDescriptorSupplier
      extends ValuationBaseDescriptorSupplier
      implements io.grpc.protobuf.ProtoMethodDescriptorSupplier {
    private final String methodName;

    ValuationMethodDescriptorSupplier(String methodName) {
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
      synchronized (ValuationGrpc.class) {
        result = serviceDescriptor;
        if (result == null) {
          serviceDescriptor = result = io.grpc.ServiceDescriptor.newBuilder(SERVICE_NAME)
              .setSchemaDescriptor(new ValuationFileDescriptorSupplier())
              .addMethod(getRunValuationMethod())
              .build();
        }
      }
    }
    return result;
  }
}
