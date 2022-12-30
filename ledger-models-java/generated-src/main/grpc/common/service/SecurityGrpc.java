package common.service;

import static io.grpc.MethodDescriptor.generateFullMethodName;

/**
 */
@javax.annotation.Generated(
    value = "by gRPC proto compiler (version 1.51.0)",
    comments = "Source: services/security-service/security_service.proto")
@io.grpc.stub.annotations.GrpcGenerated
public final class SecurityGrpc {

  private SecurityGrpc() {}

  public static final String SERVICE_NAME = "security_service.Security";

  // Static method descriptors that strictly reflect the proto.
  private static volatile io.grpc.MethodDescriptor<common.request.SecurityRequestProto,
      common.request.SecurityResponseProto> getExecuteMethod;

  @io.grpc.stub.annotations.RpcMethod(
      fullMethodName = SERVICE_NAME + '/' + "Execute",
      requestType = common.request.SecurityRequestProto.class,
      responseType = common.request.SecurityResponseProto.class,
      methodType = io.grpc.MethodDescriptor.MethodType.UNARY)
  public static io.grpc.MethodDescriptor<common.request.SecurityRequestProto,
      common.request.SecurityResponseProto> getExecuteMethod() {
    io.grpc.MethodDescriptor<common.request.SecurityRequestProto, common.request.SecurityResponseProto> getExecuteMethod;
    if ((getExecuteMethod = SecurityGrpc.getExecuteMethod) == null) {
      synchronized (SecurityGrpc.class) {
        if ((getExecuteMethod = SecurityGrpc.getExecuteMethod) == null) {
          SecurityGrpc.getExecuteMethod = getExecuteMethod =
              io.grpc.MethodDescriptor.<common.request.SecurityRequestProto, common.request.SecurityResponseProto>newBuilder()
              .setType(io.grpc.MethodDescriptor.MethodType.UNARY)
              .setFullMethodName(generateFullMethodName(SERVICE_NAME, "Execute"))
              .setSampledToLocalTracing(true)
              .setRequestMarshaller(io.grpc.protobuf.ProtoUtils.marshaller(
                  common.request.SecurityRequestProto.getDefaultInstance()))
              .setResponseMarshaller(io.grpc.protobuf.ProtoUtils.marshaller(
                  common.request.SecurityResponseProto.getDefaultInstance()))
              .setSchemaDescriptor(new SecurityMethodDescriptorSupplier("Execute"))
              .build();
        }
      }
    }
    return getExecuteMethod;
  }

  /**
   * Creates a new async stub that supports all call types for the service
   */
  public static SecurityStub newStub(io.grpc.Channel channel) {
    io.grpc.stub.AbstractStub.StubFactory<SecurityStub> factory =
      new io.grpc.stub.AbstractStub.StubFactory<SecurityStub>() {
        @java.lang.Override
        public SecurityStub newStub(io.grpc.Channel channel, io.grpc.CallOptions callOptions) {
          return new SecurityStub(channel, callOptions);
        }
      };
    return SecurityStub.newStub(factory, channel);
  }

  /**
   * Creates a new blocking-style stub that supports unary and streaming output calls on the service
   */
  public static SecurityBlockingStub newBlockingStub(
      io.grpc.Channel channel) {
    io.grpc.stub.AbstractStub.StubFactory<SecurityBlockingStub> factory =
      new io.grpc.stub.AbstractStub.StubFactory<SecurityBlockingStub>() {
        @java.lang.Override
        public SecurityBlockingStub newStub(io.grpc.Channel channel, io.grpc.CallOptions callOptions) {
          return new SecurityBlockingStub(channel, callOptions);
        }
      };
    return SecurityBlockingStub.newStub(factory, channel);
  }

  /**
   * Creates a new ListenableFuture-style stub that supports unary calls on the service
   */
  public static SecurityFutureStub newFutureStub(
      io.grpc.Channel channel) {
    io.grpc.stub.AbstractStub.StubFactory<SecurityFutureStub> factory =
      new io.grpc.stub.AbstractStub.StubFactory<SecurityFutureStub>() {
        @java.lang.Override
        public SecurityFutureStub newStub(io.grpc.Channel channel, io.grpc.CallOptions callOptions) {
          return new SecurityFutureStub(channel, callOptions);
        }
      };
    return SecurityFutureStub.newStub(factory, channel);
  }

  /**
   */
  public static abstract class SecurityImplBase implements io.grpc.BindableService {

    /**
     */
    public void execute(common.request.SecurityRequestProto request,
        io.grpc.stub.StreamObserver<common.request.SecurityResponseProto> responseObserver) {
      io.grpc.stub.ServerCalls.asyncUnimplementedUnaryCall(getExecuteMethod(), responseObserver);
    }

    @java.lang.Override public final io.grpc.ServerServiceDefinition bindService() {
      return io.grpc.ServerServiceDefinition.builder(getServiceDescriptor())
          .addMethod(
            getExecuteMethod(),
            io.grpc.stub.ServerCalls.asyncUnaryCall(
              new MethodHandlers<
                common.request.SecurityRequestProto,
                common.request.SecurityResponseProto>(
                  this, METHODID_EXECUTE)))
          .build();
    }
  }

  /**
   */
  public static final class SecurityStub extends io.grpc.stub.AbstractAsyncStub<SecurityStub> {
    private SecurityStub(
        io.grpc.Channel channel, io.grpc.CallOptions callOptions) {
      super(channel, callOptions);
    }

    @java.lang.Override
    protected SecurityStub build(
        io.grpc.Channel channel, io.grpc.CallOptions callOptions) {
      return new SecurityStub(channel, callOptions);
    }

    /**
     */
    public void execute(common.request.SecurityRequestProto request,
        io.grpc.stub.StreamObserver<common.request.SecurityResponseProto> responseObserver) {
      io.grpc.stub.ClientCalls.asyncUnaryCall(
          getChannel().newCall(getExecuteMethod(), getCallOptions()), request, responseObserver);
    }
  }

  /**
   */
  public static final class SecurityBlockingStub extends io.grpc.stub.AbstractBlockingStub<SecurityBlockingStub> {
    private SecurityBlockingStub(
        io.grpc.Channel channel, io.grpc.CallOptions callOptions) {
      super(channel, callOptions);
    }

    @java.lang.Override
    protected SecurityBlockingStub build(
        io.grpc.Channel channel, io.grpc.CallOptions callOptions) {
      return new SecurityBlockingStub(channel, callOptions);
    }

    /**
     */
    public common.request.SecurityResponseProto execute(common.request.SecurityRequestProto request) {
      return io.grpc.stub.ClientCalls.blockingUnaryCall(
          getChannel(), getExecuteMethod(), getCallOptions(), request);
    }
  }

  /**
   */
  public static final class SecurityFutureStub extends io.grpc.stub.AbstractFutureStub<SecurityFutureStub> {
    private SecurityFutureStub(
        io.grpc.Channel channel, io.grpc.CallOptions callOptions) {
      super(channel, callOptions);
    }

    @java.lang.Override
    protected SecurityFutureStub build(
        io.grpc.Channel channel, io.grpc.CallOptions callOptions) {
      return new SecurityFutureStub(channel, callOptions);
    }

    /**
     */
    public com.google.common.util.concurrent.ListenableFuture<common.request.SecurityResponseProto> execute(
        common.request.SecurityRequestProto request) {
      return io.grpc.stub.ClientCalls.futureUnaryCall(
          getChannel().newCall(getExecuteMethod(), getCallOptions()), request);
    }
  }

  private static final int METHODID_EXECUTE = 0;

  private static final class MethodHandlers<Req, Resp> implements
      io.grpc.stub.ServerCalls.UnaryMethod<Req, Resp>,
      io.grpc.stub.ServerCalls.ServerStreamingMethod<Req, Resp>,
      io.grpc.stub.ServerCalls.ClientStreamingMethod<Req, Resp>,
      io.grpc.stub.ServerCalls.BidiStreamingMethod<Req, Resp> {
    private final SecurityImplBase serviceImpl;
    private final int methodId;

    MethodHandlers(SecurityImplBase serviceImpl, int methodId) {
      this.serviceImpl = serviceImpl;
      this.methodId = methodId;
    }

    @java.lang.Override
    @java.lang.SuppressWarnings("unchecked")
    public void invoke(Req request, io.grpc.stub.StreamObserver<Resp> responseObserver) {
      switch (methodId) {
        case METHODID_EXECUTE:
          serviceImpl.execute((common.request.SecurityRequestProto) request,
              (io.grpc.stub.StreamObserver<common.request.SecurityResponseProto>) responseObserver);
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

  private static abstract class SecurityBaseDescriptorSupplier
      implements io.grpc.protobuf.ProtoFileDescriptorSupplier, io.grpc.protobuf.ProtoServiceDescriptorSupplier {
    SecurityBaseDescriptorSupplier() {}

    @java.lang.Override
    public com.google.protobuf.Descriptors.FileDescriptor getFileDescriptor() {
      return common.service.SecurityService.getDescriptor();
    }

    @java.lang.Override
    public com.google.protobuf.Descriptors.ServiceDescriptor getServiceDescriptor() {
      return getFileDescriptor().findServiceByName("Security");
    }
  }

  private static final class SecurityFileDescriptorSupplier
      extends SecurityBaseDescriptorSupplier {
    SecurityFileDescriptorSupplier() {}
  }

  private static final class SecurityMethodDescriptorSupplier
      extends SecurityBaseDescriptorSupplier
      implements io.grpc.protobuf.ProtoMethodDescriptorSupplier {
    private final String methodName;

    SecurityMethodDescriptorSupplier(String methodName) {
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
      synchronized (SecurityGrpc.class) {
        result = serviceDescriptor;
        if (result == null) {
          serviceDescriptor = result = io.grpc.ServiceDescriptor.newBuilder(SERVICE_NAME)
              .setSchemaDescriptor(new SecurityFileDescriptorSupplier())
              .addMethod(getExecuteMethod())
              .build();
        }
      }
    }
    return result;
  }
}
