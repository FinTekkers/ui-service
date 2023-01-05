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
  private static volatile io.grpc.MethodDescriptor<common.request.CreateSecurityRequestProto,
      common.request.CreateSecurityResponseProto> getCreateOrUpdateMethod;

  @io.grpc.stub.annotations.RpcMethod(
      fullMethodName = SERVICE_NAME + '/' + "CreateOrUpdate",
      requestType = common.request.CreateSecurityRequestProto.class,
      responseType = common.request.CreateSecurityResponseProto.class,
      methodType = io.grpc.MethodDescriptor.MethodType.UNARY)
  public static io.grpc.MethodDescriptor<common.request.CreateSecurityRequestProto,
      common.request.CreateSecurityResponseProto> getCreateOrUpdateMethod() {
    io.grpc.MethodDescriptor<common.request.CreateSecurityRequestProto, common.request.CreateSecurityResponseProto> getCreateOrUpdateMethod;
    if ((getCreateOrUpdateMethod = SecurityGrpc.getCreateOrUpdateMethod) == null) {
      synchronized (SecurityGrpc.class) {
        if ((getCreateOrUpdateMethod = SecurityGrpc.getCreateOrUpdateMethod) == null) {
          SecurityGrpc.getCreateOrUpdateMethod = getCreateOrUpdateMethod =
              io.grpc.MethodDescriptor.<common.request.CreateSecurityRequestProto, common.request.CreateSecurityResponseProto>newBuilder()
              .setType(io.grpc.MethodDescriptor.MethodType.UNARY)
              .setFullMethodName(generateFullMethodName(SERVICE_NAME, "CreateOrUpdate"))
              .setSampledToLocalTracing(true)
              .setRequestMarshaller(io.grpc.protobuf.ProtoUtils.marshaller(
                  common.request.CreateSecurityRequestProto.getDefaultInstance()))
              .setResponseMarshaller(io.grpc.protobuf.ProtoUtils.marshaller(
                  common.request.CreateSecurityResponseProto.getDefaultInstance()))
              .setSchemaDescriptor(new SecurityMethodDescriptorSupplier("CreateOrUpdate"))
              .build();
        }
      }
    }
    return getCreateOrUpdateMethod;
  }

  private static volatile io.grpc.MethodDescriptor<common.request.QuerySecurityRequestProto,
      common.request.QuerySecurityResponseProto> getGetByIDsMethod;

  @io.grpc.stub.annotations.RpcMethod(
      fullMethodName = SERVICE_NAME + '/' + "GetByIDs",
      requestType = common.request.QuerySecurityRequestProto.class,
      responseType = common.request.QuerySecurityResponseProto.class,
      methodType = io.grpc.MethodDescriptor.MethodType.UNARY)
  public static io.grpc.MethodDescriptor<common.request.QuerySecurityRequestProto,
      common.request.QuerySecurityResponseProto> getGetByIDsMethod() {
    io.grpc.MethodDescriptor<common.request.QuerySecurityRequestProto, common.request.QuerySecurityResponseProto> getGetByIDsMethod;
    if ((getGetByIDsMethod = SecurityGrpc.getGetByIDsMethod) == null) {
      synchronized (SecurityGrpc.class) {
        if ((getGetByIDsMethod = SecurityGrpc.getGetByIDsMethod) == null) {
          SecurityGrpc.getGetByIDsMethod = getGetByIDsMethod =
              io.grpc.MethodDescriptor.<common.request.QuerySecurityRequestProto, common.request.QuerySecurityResponseProto>newBuilder()
              .setType(io.grpc.MethodDescriptor.MethodType.UNARY)
              .setFullMethodName(generateFullMethodName(SERVICE_NAME, "GetByIDs"))
              .setSampledToLocalTracing(true)
              .setRequestMarshaller(io.grpc.protobuf.ProtoUtils.marshaller(
                  common.request.QuerySecurityRequestProto.getDefaultInstance()))
              .setResponseMarshaller(io.grpc.protobuf.ProtoUtils.marshaller(
                  common.request.QuerySecurityResponseProto.getDefaultInstance()))
              .setSchemaDescriptor(new SecurityMethodDescriptorSupplier("GetByIDs"))
              .build();
        }
      }
    }
    return getGetByIDsMethod;
  }

  private static volatile io.grpc.MethodDescriptor<common.request.QuerySecurityRequestProto,
      common.request.QuerySecurityResponseProto> getSearchMethod;

  @io.grpc.stub.annotations.RpcMethod(
      fullMethodName = SERVICE_NAME + '/' + "Search",
      requestType = common.request.QuerySecurityRequestProto.class,
      responseType = common.request.QuerySecurityResponseProto.class,
      methodType = io.grpc.MethodDescriptor.MethodType.UNARY)
  public static io.grpc.MethodDescriptor<common.request.QuerySecurityRequestProto,
      common.request.QuerySecurityResponseProto> getSearchMethod() {
    io.grpc.MethodDescriptor<common.request.QuerySecurityRequestProto, common.request.QuerySecurityResponseProto> getSearchMethod;
    if ((getSearchMethod = SecurityGrpc.getSearchMethod) == null) {
      synchronized (SecurityGrpc.class) {
        if ((getSearchMethod = SecurityGrpc.getSearchMethod) == null) {
          SecurityGrpc.getSearchMethod = getSearchMethod =
              io.grpc.MethodDescriptor.<common.request.QuerySecurityRequestProto, common.request.QuerySecurityResponseProto>newBuilder()
              .setType(io.grpc.MethodDescriptor.MethodType.UNARY)
              .setFullMethodName(generateFullMethodName(SERVICE_NAME, "Search"))
              .setSampledToLocalTracing(true)
              .setRequestMarshaller(io.grpc.protobuf.ProtoUtils.marshaller(
                  common.request.QuerySecurityRequestProto.getDefaultInstance()))
              .setResponseMarshaller(io.grpc.protobuf.ProtoUtils.marshaller(
                  common.request.QuerySecurityResponseProto.getDefaultInstance()))
              .setSchemaDescriptor(new SecurityMethodDescriptorSupplier("Search"))
              .build();
        }
      }
    }
    return getSearchMethod;
  }

  private static volatile io.grpc.MethodDescriptor<common.request.QuerySecurityRequestProto,
      common.request.QuerySecurityResponseProto> getListIDsMethod;

  @io.grpc.stub.annotations.RpcMethod(
      fullMethodName = SERVICE_NAME + '/' + "ListIDs",
      requestType = common.request.QuerySecurityRequestProto.class,
      responseType = common.request.QuerySecurityResponseProto.class,
      methodType = io.grpc.MethodDescriptor.MethodType.UNARY)
  public static io.grpc.MethodDescriptor<common.request.QuerySecurityRequestProto,
      common.request.QuerySecurityResponseProto> getListIDsMethod() {
    io.grpc.MethodDescriptor<common.request.QuerySecurityRequestProto, common.request.QuerySecurityResponseProto> getListIDsMethod;
    if ((getListIDsMethod = SecurityGrpc.getListIDsMethod) == null) {
      synchronized (SecurityGrpc.class) {
        if ((getListIDsMethod = SecurityGrpc.getListIDsMethod) == null) {
          SecurityGrpc.getListIDsMethod = getListIDsMethod =
              io.grpc.MethodDescriptor.<common.request.QuerySecurityRequestProto, common.request.QuerySecurityResponseProto>newBuilder()
              .setType(io.grpc.MethodDescriptor.MethodType.UNARY)
              .setFullMethodName(generateFullMethodName(SERVICE_NAME, "ListIDs"))
              .setSampledToLocalTracing(true)
              .setRequestMarshaller(io.grpc.protobuf.ProtoUtils.marshaller(
                  common.request.QuerySecurityRequestProto.getDefaultInstance()))
              .setResponseMarshaller(io.grpc.protobuf.ProtoUtils.marshaller(
                  common.request.QuerySecurityResponseProto.getDefaultInstance()))
              .setSchemaDescriptor(new SecurityMethodDescriptorSupplier("ListIDs"))
              .build();
        }
      }
    }
    return getListIDsMethod;
  }

  private static volatile io.grpc.MethodDescriptor<common.request.QuerySecurityRequestProto,
      util.errors.Summary.SummaryProto> getValidateCreateOrUpdateMethod;

  @io.grpc.stub.annotations.RpcMethod(
      fullMethodName = SERVICE_NAME + '/' + "ValidateCreateOrUpdate",
      requestType = common.request.QuerySecurityRequestProto.class,
      responseType = util.errors.Summary.SummaryProto.class,
      methodType = io.grpc.MethodDescriptor.MethodType.UNARY)
  public static io.grpc.MethodDescriptor<common.request.QuerySecurityRequestProto,
      util.errors.Summary.SummaryProto> getValidateCreateOrUpdateMethod() {
    io.grpc.MethodDescriptor<common.request.QuerySecurityRequestProto, util.errors.Summary.SummaryProto> getValidateCreateOrUpdateMethod;
    if ((getValidateCreateOrUpdateMethod = SecurityGrpc.getValidateCreateOrUpdateMethod) == null) {
      synchronized (SecurityGrpc.class) {
        if ((getValidateCreateOrUpdateMethod = SecurityGrpc.getValidateCreateOrUpdateMethod) == null) {
          SecurityGrpc.getValidateCreateOrUpdateMethod = getValidateCreateOrUpdateMethod =
              io.grpc.MethodDescriptor.<common.request.QuerySecurityRequestProto, util.errors.Summary.SummaryProto>newBuilder()
              .setType(io.grpc.MethodDescriptor.MethodType.UNARY)
              .setFullMethodName(generateFullMethodName(SERVICE_NAME, "ValidateCreateOrUpdate"))
              .setSampledToLocalTracing(true)
              .setRequestMarshaller(io.grpc.protobuf.ProtoUtils.marshaller(
                  common.request.QuerySecurityRequestProto.getDefaultInstance()))
              .setResponseMarshaller(io.grpc.protobuf.ProtoUtils.marshaller(
                  util.errors.Summary.SummaryProto.getDefaultInstance()))
              .setSchemaDescriptor(new SecurityMethodDescriptorSupplier("ValidateCreateOrUpdate"))
              .build();
        }
      }
    }
    return getValidateCreateOrUpdateMethod;
  }

  private static volatile io.grpc.MethodDescriptor<common.request.QuerySecurityRequestProto,
      util.errors.Summary.SummaryProto> getValidateQueryRequestMethod;

  @io.grpc.stub.annotations.RpcMethod(
      fullMethodName = SERVICE_NAME + '/' + "ValidateQueryRequest",
      requestType = common.request.QuerySecurityRequestProto.class,
      responseType = util.errors.Summary.SummaryProto.class,
      methodType = io.grpc.MethodDescriptor.MethodType.UNARY)
  public static io.grpc.MethodDescriptor<common.request.QuerySecurityRequestProto,
      util.errors.Summary.SummaryProto> getValidateQueryRequestMethod() {
    io.grpc.MethodDescriptor<common.request.QuerySecurityRequestProto, util.errors.Summary.SummaryProto> getValidateQueryRequestMethod;
    if ((getValidateQueryRequestMethod = SecurityGrpc.getValidateQueryRequestMethod) == null) {
      synchronized (SecurityGrpc.class) {
        if ((getValidateQueryRequestMethod = SecurityGrpc.getValidateQueryRequestMethod) == null) {
          SecurityGrpc.getValidateQueryRequestMethod = getValidateQueryRequestMethod =
              io.grpc.MethodDescriptor.<common.request.QuerySecurityRequestProto, util.errors.Summary.SummaryProto>newBuilder()
              .setType(io.grpc.MethodDescriptor.MethodType.UNARY)
              .setFullMethodName(generateFullMethodName(SERVICE_NAME, "ValidateQueryRequest"))
              .setSampledToLocalTracing(true)
              .setRequestMarshaller(io.grpc.protobuf.ProtoUtils.marshaller(
                  common.request.QuerySecurityRequestProto.getDefaultInstance()))
              .setResponseMarshaller(io.grpc.protobuf.ProtoUtils.marshaller(
                  util.errors.Summary.SummaryProto.getDefaultInstance()))
              .setSchemaDescriptor(new SecurityMethodDescriptorSupplier("ValidateQueryRequest"))
              .build();
        }
      }
    }
    return getValidateQueryRequestMethod;
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
    public void createOrUpdate(common.request.CreateSecurityRequestProto request,
        io.grpc.stub.StreamObserver<common.request.CreateSecurityResponseProto> responseObserver) {
      io.grpc.stub.ServerCalls.asyncUnimplementedUnaryCall(getCreateOrUpdateMethod(), responseObserver);
    }

    /**
     */
    public void getByIDs(common.request.QuerySecurityRequestProto request,
        io.grpc.stub.StreamObserver<common.request.QuerySecurityResponseProto> responseObserver) {
      io.grpc.stub.ServerCalls.asyncUnimplementedUnaryCall(getGetByIDsMethod(), responseObserver);
    }

    /**
     */
    public void search(common.request.QuerySecurityRequestProto request,
        io.grpc.stub.StreamObserver<common.request.QuerySecurityResponseProto> responseObserver) {
      io.grpc.stub.ServerCalls.asyncUnimplementedUnaryCall(getSearchMethod(), responseObserver);
    }

    /**
     */
    public void listIDs(common.request.QuerySecurityRequestProto request,
        io.grpc.stub.StreamObserver<common.request.QuerySecurityResponseProto> responseObserver) {
      io.grpc.stub.ServerCalls.asyncUnimplementedUnaryCall(getListIDsMethod(), responseObserver);
    }

    /**
     */
    public void validateCreateOrUpdate(common.request.QuerySecurityRequestProto request,
        io.grpc.stub.StreamObserver<util.errors.Summary.SummaryProto> responseObserver) {
      io.grpc.stub.ServerCalls.asyncUnimplementedUnaryCall(getValidateCreateOrUpdateMethod(), responseObserver);
    }

    /**
     */
    public void validateQueryRequest(common.request.QuerySecurityRequestProto request,
        io.grpc.stub.StreamObserver<util.errors.Summary.SummaryProto> responseObserver) {
      io.grpc.stub.ServerCalls.asyncUnimplementedUnaryCall(getValidateQueryRequestMethod(), responseObserver);
    }

    @java.lang.Override public final io.grpc.ServerServiceDefinition bindService() {
      return io.grpc.ServerServiceDefinition.builder(getServiceDescriptor())
          .addMethod(
            getCreateOrUpdateMethod(),
            io.grpc.stub.ServerCalls.asyncUnaryCall(
              new MethodHandlers<
                common.request.CreateSecurityRequestProto,
                common.request.CreateSecurityResponseProto>(
                  this, METHODID_CREATE_OR_UPDATE)))
          .addMethod(
            getGetByIDsMethod(),
            io.grpc.stub.ServerCalls.asyncUnaryCall(
              new MethodHandlers<
                common.request.QuerySecurityRequestProto,
                common.request.QuerySecurityResponseProto>(
                  this, METHODID_GET_BY_IDS)))
          .addMethod(
            getSearchMethod(),
            io.grpc.stub.ServerCalls.asyncUnaryCall(
              new MethodHandlers<
                common.request.QuerySecurityRequestProto,
                common.request.QuerySecurityResponseProto>(
                  this, METHODID_SEARCH)))
          .addMethod(
            getListIDsMethod(),
            io.grpc.stub.ServerCalls.asyncUnaryCall(
              new MethodHandlers<
                common.request.QuerySecurityRequestProto,
                common.request.QuerySecurityResponseProto>(
                  this, METHODID_LIST_IDS)))
          .addMethod(
            getValidateCreateOrUpdateMethod(),
            io.grpc.stub.ServerCalls.asyncUnaryCall(
              new MethodHandlers<
                common.request.QuerySecurityRequestProto,
                util.errors.Summary.SummaryProto>(
                  this, METHODID_VALIDATE_CREATE_OR_UPDATE)))
          .addMethod(
            getValidateQueryRequestMethod(),
            io.grpc.stub.ServerCalls.asyncUnaryCall(
              new MethodHandlers<
                common.request.QuerySecurityRequestProto,
                util.errors.Summary.SummaryProto>(
                  this, METHODID_VALIDATE_QUERY_REQUEST)))
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
    public void createOrUpdate(common.request.CreateSecurityRequestProto request,
        io.grpc.stub.StreamObserver<common.request.CreateSecurityResponseProto> responseObserver) {
      io.grpc.stub.ClientCalls.asyncUnaryCall(
          getChannel().newCall(getCreateOrUpdateMethod(), getCallOptions()), request, responseObserver);
    }

    /**
     */
    public void getByIDs(common.request.QuerySecurityRequestProto request,
        io.grpc.stub.StreamObserver<common.request.QuerySecurityResponseProto> responseObserver) {
      io.grpc.stub.ClientCalls.asyncUnaryCall(
          getChannel().newCall(getGetByIDsMethod(), getCallOptions()), request, responseObserver);
    }

    /**
     */
    public void search(common.request.QuerySecurityRequestProto request,
        io.grpc.stub.StreamObserver<common.request.QuerySecurityResponseProto> responseObserver) {
      io.grpc.stub.ClientCalls.asyncUnaryCall(
          getChannel().newCall(getSearchMethod(), getCallOptions()), request, responseObserver);
    }

    /**
     */
    public void listIDs(common.request.QuerySecurityRequestProto request,
        io.grpc.stub.StreamObserver<common.request.QuerySecurityResponseProto> responseObserver) {
      io.grpc.stub.ClientCalls.asyncUnaryCall(
          getChannel().newCall(getListIDsMethod(), getCallOptions()), request, responseObserver);
    }

    /**
     */
    public void validateCreateOrUpdate(common.request.QuerySecurityRequestProto request,
        io.grpc.stub.StreamObserver<util.errors.Summary.SummaryProto> responseObserver) {
      io.grpc.stub.ClientCalls.asyncUnaryCall(
          getChannel().newCall(getValidateCreateOrUpdateMethod(), getCallOptions()), request, responseObserver);
    }

    /**
     */
    public void validateQueryRequest(common.request.QuerySecurityRequestProto request,
        io.grpc.stub.StreamObserver<util.errors.Summary.SummaryProto> responseObserver) {
      io.grpc.stub.ClientCalls.asyncUnaryCall(
          getChannel().newCall(getValidateQueryRequestMethod(), getCallOptions()), request, responseObserver);
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
    public common.request.CreateSecurityResponseProto createOrUpdate(common.request.CreateSecurityRequestProto request) {
      return io.grpc.stub.ClientCalls.blockingUnaryCall(
          getChannel(), getCreateOrUpdateMethod(), getCallOptions(), request);
    }

    /**
     */
    public common.request.QuerySecurityResponseProto getByIDs(common.request.QuerySecurityRequestProto request) {
      return io.grpc.stub.ClientCalls.blockingUnaryCall(
          getChannel(), getGetByIDsMethod(), getCallOptions(), request);
    }

    /**
     */
    public common.request.QuerySecurityResponseProto search(common.request.QuerySecurityRequestProto request) {
      return io.grpc.stub.ClientCalls.blockingUnaryCall(
          getChannel(), getSearchMethod(), getCallOptions(), request);
    }

    /**
     */
    public common.request.QuerySecurityResponseProto listIDs(common.request.QuerySecurityRequestProto request) {
      return io.grpc.stub.ClientCalls.blockingUnaryCall(
          getChannel(), getListIDsMethod(), getCallOptions(), request);
    }

    /**
     */
    public util.errors.Summary.SummaryProto validateCreateOrUpdate(common.request.QuerySecurityRequestProto request) {
      return io.grpc.stub.ClientCalls.blockingUnaryCall(
          getChannel(), getValidateCreateOrUpdateMethod(), getCallOptions(), request);
    }

    /**
     */
    public util.errors.Summary.SummaryProto validateQueryRequest(common.request.QuerySecurityRequestProto request) {
      return io.grpc.stub.ClientCalls.blockingUnaryCall(
          getChannel(), getValidateQueryRequestMethod(), getCallOptions(), request);
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
    public com.google.common.util.concurrent.ListenableFuture<common.request.CreateSecurityResponseProto> createOrUpdate(
        common.request.CreateSecurityRequestProto request) {
      return io.grpc.stub.ClientCalls.futureUnaryCall(
          getChannel().newCall(getCreateOrUpdateMethod(), getCallOptions()), request);
    }

    /**
     */
    public com.google.common.util.concurrent.ListenableFuture<common.request.QuerySecurityResponseProto> getByIDs(
        common.request.QuerySecurityRequestProto request) {
      return io.grpc.stub.ClientCalls.futureUnaryCall(
          getChannel().newCall(getGetByIDsMethod(), getCallOptions()), request);
    }

    /**
     */
    public com.google.common.util.concurrent.ListenableFuture<common.request.QuerySecurityResponseProto> search(
        common.request.QuerySecurityRequestProto request) {
      return io.grpc.stub.ClientCalls.futureUnaryCall(
          getChannel().newCall(getSearchMethod(), getCallOptions()), request);
    }

    /**
     */
    public com.google.common.util.concurrent.ListenableFuture<common.request.QuerySecurityResponseProto> listIDs(
        common.request.QuerySecurityRequestProto request) {
      return io.grpc.stub.ClientCalls.futureUnaryCall(
          getChannel().newCall(getListIDsMethod(), getCallOptions()), request);
    }

    /**
     */
    public com.google.common.util.concurrent.ListenableFuture<util.errors.Summary.SummaryProto> validateCreateOrUpdate(
        common.request.QuerySecurityRequestProto request) {
      return io.grpc.stub.ClientCalls.futureUnaryCall(
          getChannel().newCall(getValidateCreateOrUpdateMethod(), getCallOptions()), request);
    }

    /**
     */
    public com.google.common.util.concurrent.ListenableFuture<util.errors.Summary.SummaryProto> validateQueryRequest(
        common.request.QuerySecurityRequestProto request) {
      return io.grpc.stub.ClientCalls.futureUnaryCall(
          getChannel().newCall(getValidateQueryRequestMethod(), getCallOptions()), request);
    }
  }

  private static final int METHODID_CREATE_OR_UPDATE = 0;
  private static final int METHODID_GET_BY_IDS = 1;
  private static final int METHODID_SEARCH = 2;
  private static final int METHODID_LIST_IDS = 3;
  private static final int METHODID_VALIDATE_CREATE_OR_UPDATE = 4;
  private static final int METHODID_VALIDATE_QUERY_REQUEST = 5;

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
        case METHODID_CREATE_OR_UPDATE:
          serviceImpl.createOrUpdate((common.request.CreateSecurityRequestProto) request,
              (io.grpc.stub.StreamObserver<common.request.CreateSecurityResponseProto>) responseObserver);
          break;
        case METHODID_GET_BY_IDS:
          serviceImpl.getByIDs((common.request.QuerySecurityRequestProto) request,
              (io.grpc.stub.StreamObserver<common.request.QuerySecurityResponseProto>) responseObserver);
          break;
        case METHODID_SEARCH:
          serviceImpl.search((common.request.QuerySecurityRequestProto) request,
              (io.grpc.stub.StreamObserver<common.request.QuerySecurityResponseProto>) responseObserver);
          break;
        case METHODID_LIST_IDS:
          serviceImpl.listIDs((common.request.QuerySecurityRequestProto) request,
              (io.grpc.stub.StreamObserver<common.request.QuerySecurityResponseProto>) responseObserver);
          break;
        case METHODID_VALIDATE_CREATE_OR_UPDATE:
          serviceImpl.validateCreateOrUpdate((common.request.QuerySecurityRequestProto) request,
              (io.grpc.stub.StreamObserver<util.errors.Summary.SummaryProto>) responseObserver);
          break;
        case METHODID_VALIDATE_QUERY_REQUEST:
          serviceImpl.validateQueryRequest((common.request.QuerySecurityRequestProto) request,
              (io.grpc.stub.StreamObserver<util.errors.Summary.SummaryProto>) responseObserver);
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
              .addMethod(getCreateOrUpdateMethod())
              .addMethod(getGetByIDsMethod())
              .addMethod(getSearchMethod())
              .addMethod(getListIDsMethod())
              .addMethod(getValidateCreateOrUpdateMethod())
              .addMethod(getValidateQueryRequestMethod())
              .build();
        }
      }
    }
    return result;
  }
}
