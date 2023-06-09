package fintekkers.services.price_service;

import static io.grpc.MethodDescriptor.generateFullMethodName;

/**
 */
@javax.annotation.Generated(
    value = "by gRPC proto compiler (version 1.51.0)",
    comments = "Source: fintekkers/services/price-service/price_service.proto")
@io.grpc.stub.annotations.GrpcGenerated
public final class PriceGrpc {

  private PriceGrpc() {}

  public static final String SERVICE_NAME = "fintekkers.services.price_service.Price";

  // Static method descriptors that strictly reflect the proto.
  private static volatile io.grpc.MethodDescriptor<fintekkers.requests.price.CreatePriceRequestProto,
      fintekkers.requests.price.CreatePriceResponseProto> getCreateOrUpdateMethod;

  @io.grpc.stub.annotations.RpcMethod(
      fullMethodName = SERVICE_NAME + '/' + "CreateOrUpdate",
      requestType = fintekkers.requests.price.CreatePriceRequestProto.class,
      responseType = fintekkers.requests.price.CreatePriceResponseProto.class,
      methodType = io.grpc.MethodDescriptor.MethodType.UNARY)
  public static io.grpc.MethodDescriptor<fintekkers.requests.price.CreatePriceRequestProto,
      fintekkers.requests.price.CreatePriceResponseProto> getCreateOrUpdateMethod() {
    io.grpc.MethodDescriptor<fintekkers.requests.price.CreatePriceRequestProto, fintekkers.requests.price.CreatePriceResponseProto> getCreateOrUpdateMethod;
    if ((getCreateOrUpdateMethod = PriceGrpc.getCreateOrUpdateMethod) == null) {
      synchronized (PriceGrpc.class) {
        if ((getCreateOrUpdateMethod = PriceGrpc.getCreateOrUpdateMethod) == null) {
          PriceGrpc.getCreateOrUpdateMethod = getCreateOrUpdateMethod =
              io.grpc.MethodDescriptor.<fintekkers.requests.price.CreatePriceRequestProto, fintekkers.requests.price.CreatePriceResponseProto>newBuilder()
              .setType(io.grpc.MethodDescriptor.MethodType.UNARY)
              .setFullMethodName(generateFullMethodName(SERVICE_NAME, "CreateOrUpdate"))
              .setSampledToLocalTracing(true)
              .setRequestMarshaller(io.grpc.protobuf.ProtoUtils.marshaller(
                  fintekkers.requests.price.CreatePriceRequestProto.getDefaultInstance()))
              .setResponseMarshaller(io.grpc.protobuf.ProtoUtils.marshaller(
                  fintekkers.requests.price.CreatePriceResponseProto.getDefaultInstance()))
              .setSchemaDescriptor(new PriceMethodDescriptorSupplier("CreateOrUpdate"))
              .build();
        }
      }
    }
    return getCreateOrUpdateMethod;
  }

  private static volatile io.grpc.MethodDescriptor<fintekkers.requests.price.QueryPriceRequestProto,
      fintekkers.requests.price.QueryPriceResponseProto> getGetByIDsMethod;

  @io.grpc.stub.annotations.RpcMethod(
      fullMethodName = SERVICE_NAME + '/' + "GetByIDs",
      requestType = fintekkers.requests.price.QueryPriceRequestProto.class,
      responseType = fintekkers.requests.price.QueryPriceResponseProto.class,
      methodType = io.grpc.MethodDescriptor.MethodType.UNARY)
  public static io.grpc.MethodDescriptor<fintekkers.requests.price.QueryPriceRequestProto,
      fintekkers.requests.price.QueryPriceResponseProto> getGetByIDsMethod() {
    io.grpc.MethodDescriptor<fintekkers.requests.price.QueryPriceRequestProto, fintekkers.requests.price.QueryPriceResponseProto> getGetByIDsMethod;
    if ((getGetByIDsMethod = PriceGrpc.getGetByIDsMethod) == null) {
      synchronized (PriceGrpc.class) {
        if ((getGetByIDsMethod = PriceGrpc.getGetByIDsMethod) == null) {
          PriceGrpc.getGetByIDsMethod = getGetByIDsMethod =
              io.grpc.MethodDescriptor.<fintekkers.requests.price.QueryPriceRequestProto, fintekkers.requests.price.QueryPriceResponseProto>newBuilder()
              .setType(io.grpc.MethodDescriptor.MethodType.UNARY)
              .setFullMethodName(generateFullMethodName(SERVICE_NAME, "GetByIDs"))
              .setSampledToLocalTracing(true)
              .setRequestMarshaller(io.grpc.protobuf.ProtoUtils.marshaller(
                  fintekkers.requests.price.QueryPriceRequestProto.getDefaultInstance()))
              .setResponseMarshaller(io.grpc.protobuf.ProtoUtils.marshaller(
                  fintekkers.requests.price.QueryPriceResponseProto.getDefaultInstance()))
              .setSchemaDescriptor(new PriceMethodDescriptorSupplier("GetByIDs"))
              .build();
        }
      }
    }
    return getGetByIDsMethod;
  }

  private static volatile io.grpc.MethodDescriptor<fintekkers.requests.price.QueryPriceRequestProto,
      fintekkers.requests.price.QueryPriceResponseProto> getSearchMethod;

  @io.grpc.stub.annotations.RpcMethod(
      fullMethodName = SERVICE_NAME + '/' + "Search",
      requestType = fintekkers.requests.price.QueryPriceRequestProto.class,
      responseType = fintekkers.requests.price.QueryPriceResponseProto.class,
      methodType = io.grpc.MethodDescriptor.MethodType.SERVER_STREAMING)
  public static io.grpc.MethodDescriptor<fintekkers.requests.price.QueryPriceRequestProto,
      fintekkers.requests.price.QueryPriceResponseProto> getSearchMethod() {
    io.grpc.MethodDescriptor<fintekkers.requests.price.QueryPriceRequestProto, fintekkers.requests.price.QueryPriceResponseProto> getSearchMethod;
    if ((getSearchMethod = PriceGrpc.getSearchMethod) == null) {
      synchronized (PriceGrpc.class) {
        if ((getSearchMethod = PriceGrpc.getSearchMethod) == null) {
          PriceGrpc.getSearchMethod = getSearchMethod =
              io.grpc.MethodDescriptor.<fintekkers.requests.price.QueryPriceRequestProto, fintekkers.requests.price.QueryPriceResponseProto>newBuilder()
              .setType(io.grpc.MethodDescriptor.MethodType.SERVER_STREAMING)
              .setFullMethodName(generateFullMethodName(SERVICE_NAME, "Search"))
              .setSampledToLocalTracing(true)
              .setRequestMarshaller(io.grpc.protobuf.ProtoUtils.marshaller(
                  fintekkers.requests.price.QueryPriceRequestProto.getDefaultInstance()))
              .setResponseMarshaller(io.grpc.protobuf.ProtoUtils.marshaller(
                  fintekkers.requests.price.QueryPriceResponseProto.getDefaultInstance()))
              .setSchemaDescriptor(new PriceMethodDescriptorSupplier("Search"))
              .build();
        }
      }
    }
    return getSearchMethod;
  }

  private static volatile io.grpc.MethodDescriptor<fintekkers.requests.price.QueryPriceRequestProto,
      fintekkers.requests.price.QueryPriceResponseProto> getListIDsMethod;

  @io.grpc.stub.annotations.RpcMethod(
      fullMethodName = SERVICE_NAME + '/' + "ListIDs",
      requestType = fintekkers.requests.price.QueryPriceRequestProto.class,
      responseType = fintekkers.requests.price.QueryPriceResponseProto.class,
      methodType = io.grpc.MethodDescriptor.MethodType.UNARY)
  public static io.grpc.MethodDescriptor<fintekkers.requests.price.QueryPriceRequestProto,
      fintekkers.requests.price.QueryPriceResponseProto> getListIDsMethod() {
    io.grpc.MethodDescriptor<fintekkers.requests.price.QueryPriceRequestProto, fintekkers.requests.price.QueryPriceResponseProto> getListIDsMethod;
    if ((getListIDsMethod = PriceGrpc.getListIDsMethod) == null) {
      synchronized (PriceGrpc.class) {
        if ((getListIDsMethod = PriceGrpc.getListIDsMethod) == null) {
          PriceGrpc.getListIDsMethod = getListIDsMethod =
              io.grpc.MethodDescriptor.<fintekkers.requests.price.QueryPriceRequestProto, fintekkers.requests.price.QueryPriceResponseProto>newBuilder()
              .setType(io.grpc.MethodDescriptor.MethodType.UNARY)
              .setFullMethodName(generateFullMethodName(SERVICE_NAME, "ListIDs"))
              .setSampledToLocalTracing(true)
              .setRequestMarshaller(io.grpc.protobuf.ProtoUtils.marshaller(
                  fintekkers.requests.price.QueryPriceRequestProto.getDefaultInstance()))
              .setResponseMarshaller(io.grpc.protobuf.ProtoUtils.marshaller(
                  fintekkers.requests.price.QueryPriceResponseProto.getDefaultInstance()))
              .setSchemaDescriptor(new PriceMethodDescriptorSupplier("ListIDs"))
              .build();
        }
      }
    }
    return getListIDsMethod;
  }

  private static volatile io.grpc.MethodDescriptor<fintekkers.requests.price.CreatePriceRequestProto,
      fintekkers.requests.util.errors.Summary.SummaryProto> getValidateCreateOrUpdateMethod;

  @io.grpc.stub.annotations.RpcMethod(
      fullMethodName = SERVICE_NAME + '/' + "ValidateCreateOrUpdate",
      requestType = fintekkers.requests.price.CreatePriceRequestProto.class,
      responseType = fintekkers.requests.util.errors.Summary.SummaryProto.class,
      methodType = io.grpc.MethodDescriptor.MethodType.UNARY)
  public static io.grpc.MethodDescriptor<fintekkers.requests.price.CreatePriceRequestProto,
      fintekkers.requests.util.errors.Summary.SummaryProto> getValidateCreateOrUpdateMethod() {
    io.grpc.MethodDescriptor<fintekkers.requests.price.CreatePriceRequestProto, fintekkers.requests.util.errors.Summary.SummaryProto> getValidateCreateOrUpdateMethod;
    if ((getValidateCreateOrUpdateMethod = PriceGrpc.getValidateCreateOrUpdateMethod) == null) {
      synchronized (PriceGrpc.class) {
        if ((getValidateCreateOrUpdateMethod = PriceGrpc.getValidateCreateOrUpdateMethod) == null) {
          PriceGrpc.getValidateCreateOrUpdateMethod = getValidateCreateOrUpdateMethod =
              io.grpc.MethodDescriptor.<fintekkers.requests.price.CreatePriceRequestProto, fintekkers.requests.util.errors.Summary.SummaryProto>newBuilder()
              .setType(io.grpc.MethodDescriptor.MethodType.UNARY)
              .setFullMethodName(generateFullMethodName(SERVICE_NAME, "ValidateCreateOrUpdate"))
              .setSampledToLocalTracing(true)
              .setRequestMarshaller(io.grpc.protobuf.ProtoUtils.marshaller(
                  fintekkers.requests.price.CreatePriceRequestProto.getDefaultInstance()))
              .setResponseMarshaller(io.grpc.protobuf.ProtoUtils.marshaller(
                  fintekkers.requests.util.errors.Summary.SummaryProto.getDefaultInstance()))
              .setSchemaDescriptor(new PriceMethodDescriptorSupplier("ValidateCreateOrUpdate"))
              .build();
        }
      }
    }
    return getValidateCreateOrUpdateMethod;
  }

  private static volatile io.grpc.MethodDescriptor<fintekkers.requests.price.QueryPriceRequestProto,
      fintekkers.requests.util.errors.Summary.SummaryProto> getValidateQueryRequestMethod;

  @io.grpc.stub.annotations.RpcMethod(
      fullMethodName = SERVICE_NAME + '/' + "ValidateQueryRequest",
      requestType = fintekkers.requests.price.QueryPriceRequestProto.class,
      responseType = fintekkers.requests.util.errors.Summary.SummaryProto.class,
      methodType = io.grpc.MethodDescriptor.MethodType.UNARY)
  public static io.grpc.MethodDescriptor<fintekkers.requests.price.QueryPriceRequestProto,
      fintekkers.requests.util.errors.Summary.SummaryProto> getValidateQueryRequestMethod() {
    io.grpc.MethodDescriptor<fintekkers.requests.price.QueryPriceRequestProto, fintekkers.requests.util.errors.Summary.SummaryProto> getValidateQueryRequestMethod;
    if ((getValidateQueryRequestMethod = PriceGrpc.getValidateQueryRequestMethod) == null) {
      synchronized (PriceGrpc.class) {
        if ((getValidateQueryRequestMethod = PriceGrpc.getValidateQueryRequestMethod) == null) {
          PriceGrpc.getValidateQueryRequestMethod = getValidateQueryRequestMethod =
              io.grpc.MethodDescriptor.<fintekkers.requests.price.QueryPriceRequestProto, fintekkers.requests.util.errors.Summary.SummaryProto>newBuilder()
              .setType(io.grpc.MethodDescriptor.MethodType.UNARY)
              .setFullMethodName(generateFullMethodName(SERVICE_NAME, "ValidateQueryRequest"))
              .setSampledToLocalTracing(true)
              .setRequestMarshaller(io.grpc.protobuf.ProtoUtils.marshaller(
                  fintekkers.requests.price.QueryPriceRequestProto.getDefaultInstance()))
              .setResponseMarshaller(io.grpc.protobuf.ProtoUtils.marshaller(
                  fintekkers.requests.util.errors.Summary.SummaryProto.getDefaultInstance()))
              .setSchemaDescriptor(new PriceMethodDescriptorSupplier("ValidateQueryRequest"))
              .build();
        }
      }
    }
    return getValidateQueryRequestMethod;
  }

  /**
   * Creates a new async stub that supports all call types for the service
   */
  public static PriceStub newStub(io.grpc.Channel channel) {
    io.grpc.stub.AbstractStub.StubFactory<PriceStub> factory =
      new io.grpc.stub.AbstractStub.StubFactory<PriceStub>() {
        @java.lang.Override
        public PriceStub newStub(io.grpc.Channel channel, io.grpc.CallOptions callOptions) {
          return new PriceStub(channel, callOptions);
        }
      };
    return PriceStub.newStub(factory, channel);
  }

  /**
   * Creates a new blocking-style stub that supports unary and streaming output calls on the service
   */
  public static PriceBlockingStub newBlockingStub(
      io.grpc.Channel channel) {
    io.grpc.stub.AbstractStub.StubFactory<PriceBlockingStub> factory =
      new io.grpc.stub.AbstractStub.StubFactory<PriceBlockingStub>() {
        @java.lang.Override
        public PriceBlockingStub newStub(io.grpc.Channel channel, io.grpc.CallOptions callOptions) {
          return new PriceBlockingStub(channel, callOptions);
        }
      };
    return PriceBlockingStub.newStub(factory, channel);
  }

  /**
   * Creates a new ListenableFuture-style stub that supports unary calls on the service
   */
  public static PriceFutureStub newFutureStub(
      io.grpc.Channel channel) {
    io.grpc.stub.AbstractStub.StubFactory<PriceFutureStub> factory =
      new io.grpc.stub.AbstractStub.StubFactory<PriceFutureStub>() {
        @java.lang.Override
        public PriceFutureStub newStub(io.grpc.Channel channel, io.grpc.CallOptions callOptions) {
          return new PriceFutureStub(channel, callOptions);
        }
      };
    return PriceFutureStub.newStub(factory, channel);
  }

  /**
   */
  public static abstract class PriceImplBase implements io.grpc.BindableService {

    /**
     */
    public void createOrUpdate(fintekkers.requests.price.CreatePriceRequestProto request,
        io.grpc.stub.StreamObserver<fintekkers.requests.price.CreatePriceResponseProto> responseObserver) {
      io.grpc.stub.ServerCalls.asyncUnimplementedUnaryCall(getCreateOrUpdateMethod(), responseObserver);
    }

    /**
     */
    public void getByIDs(fintekkers.requests.price.QueryPriceRequestProto request,
        io.grpc.stub.StreamObserver<fintekkers.requests.price.QueryPriceResponseProto> responseObserver) {
      io.grpc.stub.ServerCalls.asyncUnimplementedUnaryCall(getGetByIDsMethod(), responseObserver);
    }

    /**
     */
    public void search(fintekkers.requests.price.QueryPriceRequestProto request,
        io.grpc.stub.StreamObserver<fintekkers.requests.price.QueryPriceResponseProto> responseObserver) {
      io.grpc.stub.ServerCalls.asyncUnimplementedUnaryCall(getSearchMethod(), responseObserver);
    }

    /**
     */
    public void listIDs(fintekkers.requests.price.QueryPriceRequestProto request,
        io.grpc.stub.StreamObserver<fintekkers.requests.price.QueryPriceResponseProto> responseObserver) {
      io.grpc.stub.ServerCalls.asyncUnimplementedUnaryCall(getListIDsMethod(), responseObserver);
    }

    /**
     */
    public void validateCreateOrUpdate(fintekkers.requests.price.CreatePriceRequestProto request,
        io.grpc.stub.StreamObserver<fintekkers.requests.util.errors.Summary.SummaryProto> responseObserver) {
      io.grpc.stub.ServerCalls.asyncUnimplementedUnaryCall(getValidateCreateOrUpdateMethod(), responseObserver);
    }

    /**
     */
    public void validateQueryRequest(fintekkers.requests.price.QueryPriceRequestProto request,
        io.grpc.stub.StreamObserver<fintekkers.requests.util.errors.Summary.SummaryProto> responseObserver) {
      io.grpc.stub.ServerCalls.asyncUnimplementedUnaryCall(getValidateQueryRequestMethod(), responseObserver);
    }

    @java.lang.Override public final io.grpc.ServerServiceDefinition bindService() {
      return io.grpc.ServerServiceDefinition.builder(getServiceDescriptor())
          .addMethod(
            getCreateOrUpdateMethod(),
            io.grpc.stub.ServerCalls.asyncUnaryCall(
              new MethodHandlers<
                fintekkers.requests.price.CreatePriceRequestProto,
                fintekkers.requests.price.CreatePriceResponseProto>(
                  this, METHODID_CREATE_OR_UPDATE)))
          .addMethod(
            getGetByIDsMethod(),
            io.grpc.stub.ServerCalls.asyncUnaryCall(
              new MethodHandlers<
                fintekkers.requests.price.QueryPriceRequestProto,
                fintekkers.requests.price.QueryPriceResponseProto>(
                  this, METHODID_GET_BY_IDS)))
          .addMethod(
            getSearchMethod(),
            io.grpc.stub.ServerCalls.asyncServerStreamingCall(
              new MethodHandlers<
                fintekkers.requests.price.QueryPriceRequestProto,
                fintekkers.requests.price.QueryPriceResponseProto>(
                  this, METHODID_SEARCH)))
          .addMethod(
            getListIDsMethod(),
            io.grpc.stub.ServerCalls.asyncUnaryCall(
              new MethodHandlers<
                fintekkers.requests.price.QueryPriceRequestProto,
                fintekkers.requests.price.QueryPriceResponseProto>(
                  this, METHODID_LIST_IDS)))
          .addMethod(
            getValidateCreateOrUpdateMethod(),
            io.grpc.stub.ServerCalls.asyncUnaryCall(
              new MethodHandlers<
                fintekkers.requests.price.CreatePriceRequestProto,
                fintekkers.requests.util.errors.Summary.SummaryProto>(
                  this, METHODID_VALIDATE_CREATE_OR_UPDATE)))
          .addMethod(
            getValidateQueryRequestMethod(),
            io.grpc.stub.ServerCalls.asyncUnaryCall(
              new MethodHandlers<
                fintekkers.requests.price.QueryPriceRequestProto,
                fintekkers.requests.util.errors.Summary.SummaryProto>(
                  this, METHODID_VALIDATE_QUERY_REQUEST)))
          .build();
    }
  }

  /**
   */
  public static final class PriceStub extends io.grpc.stub.AbstractAsyncStub<PriceStub> {
    private PriceStub(
        io.grpc.Channel channel, io.grpc.CallOptions callOptions) {
      super(channel, callOptions);
    }

    @java.lang.Override
    protected PriceStub build(
        io.grpc.Channel channel, io.grpc.CallOptions callOptions) {
      return new PriceStub(channel, callOptions);
    }

    /**
     */
    public void createOrUpdate(fintekkers.requests.price.CreatePriceRequestProto request,
        io.grpc.stub.StreamObserver<fintekkers.requests.price.CreatePriceResponseProto> responseObserver) {
      io.grpc.stub.ClientCalls.asyncUnaryCall(
          getChannel().newCall(getCreateOrUpdateMethod(), getCallOptions()), request, responseObserver);
    }

    /**
     */
    public void getByIDs(fintekkers.requests.price.QueryPriceRequestProto request,
        io.grpc.stub.StreamObserver<fintekkers.requests.price.QueryPriceResponseProto> responseObserver) {
      io.grpc.stub.ClientCalls.asyncUnaryCall(
          getChannel().newCall(getGetByIDsMethod(), getCallOptions()), request, responseObserver);
    }

    /**
     */
    public void search(fintekkers.requests.price.QueryPriceRequestProto request,
        io.grpc.stub.StreamObserver<fintekkers.requests.price.QueryPriceResponseProto> responseObserver) {
      io.grpc.stub.ClientCalls.asyncServerStreamingCall(
          getChannel().newCall(getSearchMethod(), getCallOptions()), request, responseObserver);
    }

    /**
     */
    public void listIDs(fintekkers.requests.price.QueryPriceRequestProto request,
        io.grpc.stub.StreamObserver<fintekkers.requests.price.QueryPriceResponseProto> responseObserver) {
      io.grpc.stub.ClientCalls.asyncUnaryCall(
          getChannel().newCall(getListIDsMethod(), getCallOptions()), request, responseObserver);
    }

    /**
     */
    public void validateCreateOrUpdate(fintekkers.requests.price.CreatePriceRequestProto request,
        io.grpc.stub.StreamObserver<fintekkers.requests.util.errors.Summary.SummaryProto> responseObserver) {
      io.grpc.stub.ClientCalls.asyncUnaryCall(
          getChannel().newCall(getValidateCreateOrUpdateMethod(), getCallOptions()), request, responseObserver);
    }

    /**
     */
    public void validateQueryRequest(fintekkers.requests.price.QueryPriceRequestProto request,
        io.grpc.stub.StreamObserver<fintekkers.requests.util.errors.Summary.SummaryProto> responseObserver) {
      io.grpc.stub.ClientCalls.asyncUnaryCall(
          getChannel().newCall(getValidateQueryRequestMethod(), getCallOptions()), request, responseObserver);
    }
  }

  /**
   */
  public static final class PriceBlockingStub extends io.grpc.stub.AbstractBlockingStub<PriceBlockingStub> {
    private PriceBlockingStub(
        io.grpc.Channel channel, io.grpc.CallOptions callOptions) {
      super(channel, callOptions);
    }

    @java.lang.Override
    protected PriceBlockingStub build(
        io.grpc.Channel channel, io.grpc.CallOptions callOptions) {
      return new PriceBlockingStub(channel, callOptions);
    }

    /**
     */
    public fintekkers.requests.price.CreatePriceResponseProto createOrUpdate(fintekkers.requests.price.CreatePriceRequestProto request) {
      return io.grpc.stub.ClientCalls.blockingUnaryCall(
          getChannel(), getCreateOrUpdateMethod(), getCallOptions(), request);
    }

    /**
     */
    public fintekkers.requests.price.QueryPriceResponseProto getByIDs(fintekkers.requests.price.QueryPriceRequestProto request) {
      return io.grpc.stub.ClientCalls.blockingUnaryCall(
          getChannel(), getGetByIDsMethod(), getCallOptions(), request);
    }

    /**
     */
    public java.util.Iterator<fintekkers.requests.price.QueryPriceResponseProto> search(
        fintekkers.requests.price.QueryPriceRequestProto request) {
      return io.grpc.stub.ClientCalls.blockingServerStreamingCall(
          getChannel(), getSearchMethod(), getCallOptions(), request);
    }

    /**
     */
    public fintekkers.requests.price.QueryPriceResponseProto listIDs(fintekkers.requests.price.QueryPriceRequestProto request) {
      return io.grpc.stub.ClientCalls.blockingUnaryCall(
          getChannel(), getListIDsMethod(), getCallOptions(), request);
    }

    /**
     */
    public fintekkers.requests.util.errors.Summary.SummaryProto validateCreateOrUpdate(fintekkers.requests.price.CreatePriceRequestProto request) {
      return io.grpc.stub.ClientCalls.blockingUnaryCall(
          getChannel(), getValidateCreateOrUpdateMethod(), getCallOptions(), request);
    }

    /**
     */
    public fintekkers.requests.util.errors.Summary.SummaryProto validateQueryRequest(fintekkers.requests.price.QueryPriceRequestProto request) {
      return io.grpc.stub.ClientCalls.blockingUnaryCall(
          getChannel(), getValidateQueryRequestMethod(), getCallOptions(), request);
    }
  }

  /**
   */
  public static final class PriceFutureStub extends io.grpc.stub.AbstractFutureStub<PriceFutureStub> {
    private PriceFutureStub(
        io.grpc.Channel channel, io.grpc.CallOptions callOptions) {
      super(channel, callOptions);
    }

    @java.lang.Override
    protected PriceFutureStub build(
        io.grpc.Channel channel, io.grpc.CallOptions callOptions) {
      return new PriceFutureStub(channel, callOptions);
    }

    /**
     */
    public com.google.common.util.concurrent.ListenableFuture<fintekkers.requests.price.CreatePriceResponseProto> createOrUpdate(
        fintekkers.requests.price.CreatePriceRequestProto request) {
      return io.grpc.stub.ClientCalls.futureUnaryCall(
          getChannel().newCall(getCreateOrUpdateMethod(), getCallOptions()), request);
    }

    /**
     */
    public com.google.common.util.concurrent.ListenableFuture<fintekkers.requests.price.QueryPriceResponseProto> getByIDs(
        fintekkers.requests.price.QueryPriceRequestProto request) {
      return io.grpc.stub.ClientCalls.futureUnaryCall(
          getChannel().newCall(getGetByIDsMethod(), getCallOptions()), request);
    }

    /**
     */
    public com.google.common.util.concurrent.ListenableFuture<fintekkers.requests.price.QueryPriceResponseProto> listIDs(
        fintekkers.requests.price.QueryPriceRequestProto request) {
      return io.grpc.stub.ClientCalls.futureUnaryCall(
          getChannel().newCall(getListIDsMethod(), getCallOptions()), request);
    }

    /**
     */
    public com.google.common.util.concurrent.ListenableFuture<fintekkers.requests.util.errors.Summary.SummaryProto> validateCreateOrUpdate(
        fintekkers.requests.price.CreatePriceRequestProto request) {
      return io.grpc.stub.ClientCalls.futureUnaryCall(
          getChannel().newCall(getValidateCreateOrUpdateMethod(), getCallOptions()), request);
    }

    /**
     */
    public com.google.common.util.concurrent.ListenableFuture<fintekkers.requests.util.errors.Summary.SummaryProto> validateQueryRequest(
        fintekkers.requests.price.QueryPriceRequestProto request) {
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
    private final PriceImplBase serviceImpl;
    private final int methodId;

    MethodHandlers(PriceImplBase serviceImpl, int methodId) {
      this.serviceImpl = serviceImpl;
      this.methodId = methodId;
    }

    @java.lang.Override
    @java.lang.SuppressWarnings("unchecked")
    public void invoke(Req request, io.grpc.stub.StreamObserver<Resp> responseObserver) {
      switch (methodId) {
        case METHODID_CREATE_OR_UPDATE:
          serviceImpl.createOrUpdate((fintekkers.requests.price.CreatePriceRequestProto) request,
              (io.grpc.stub.StreamObserver<fintekkers.requests.price.CreatePriceResponseProto>) responseObserver);
          break;
        case METHODID_GET_BY_IDS:
          serviceImpl.getByIDs((fintekkers.requests.price.QueryPriceRequestProto) request,
              (io.grpc.stub.StreamObserver<fintekkers.requests.price.QueryPriceResponseProto>) responseObserver);
          break;
        case METHODID_SEARCH:
          serviceImpl.search((fintekkers.requests.price.QueryPriceRequestProto) request,
              (io.grpc.stub.StreamObserver<fintekkers.requests.price.QueryPriceResponseProto>) responseObserver);
          break;
        case METHODID_LIST_IDS:
          serviceImpl.listIDs((fintekkers.requests.price.QueryPriceRequestProto) request,
              (io.grpc.stub.StreamObserver<fintekkers.requests.price.QueryPriceResponseProto>) responseObserver);
          break;
        case METHODID_VALIDATE_CREATE_OR_UPDATE:
          serviceImpl.validateCreateOrUpdate((fintekkers.requests.price.CreatePriceRequestProto) request,
              (io.grpc.stub.StreamObserver<fintekkers.requests.util.errors.Summary.SummaryProto>) responseObserver);
          break;
        case METHODID_VALIDATE_QUERY_REQUEST:
          serviceImpl.validateQueryRequest((fintekkers.requests.price.QueryPriceRequestProto) request,
              (io.grpc.stub.StreamObserver<fintekkers.requests.util.errors.Summary.SummaryProto>) responseObserver);
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

  private static abstract class PriceBaseDescriptorSupplier
      implements io.grpc.protobuf.ProtoFileDescriptorSupplier, io.grpc.protobuf.ProtoServiceDescriptorSupplier {
    PriceBaseDescriptorSupplier() {}

    @java.lang.Override
    public com.google.protobuf.Descriptors.FileDescriptor getFileDescriptor() {
      return fintekkers.services.price_service.PriceService.getDescriptor();
    }

    @java.lang.Override
    public com.google.protobuf.Descriptors.ServiceDescriptor getServiceDescriptor() {
      return getFileDescriptor().findServiceByName("Price");
    }
  }

  private static final class PriceFileDescriptorSupplier
      extends PriceBaseDescriptorSupplier {
    PriceFileDescriptorSupplier() {}
  }

  private static final class PriceMethodDescriptorSupplier
      extends PriceBaseDescriptorSupplier
      implements io.grpc.protobuf.ProtoMethodDescriptorSupplier {
    private final String methodName;

    PriceMethodDescriptorSupplier(String methodName) {
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
      synchronized (PriceGrpc.class) {
        result = serviceDescriptor;
        if (result == null) {
          serviceDescriptor = result = io.grpc.ServiceDescriptor.newBuilder(SERVICE_NAME)
              .setSchemaDescriptor(new PriceFileDescriptorSupplier())
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
