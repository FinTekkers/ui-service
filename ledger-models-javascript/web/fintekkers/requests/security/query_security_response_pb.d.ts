import * as jspb from "google-protobuf";

import * as fintekkers_models_security_security_pb from "../../models/security/security_pb";
import * as fintekkers_requests_security_query_security_request_pb from "./query_security_request_pb";
import * as fintekkers_requests_util_errors_summary_pb from "../util/errors/summary_pb";

export class QuerySecurityResponseProto extends jspb.Message {
  getObjectClass(): string;
  setObjectClass(value: string): QuerySecurityResponseProto;

  getVersion(): string;
  setVersion(value: string): QuerySecurityResponseProto;

  getQuerySecurityInput():
    | fintekkers_requests_security_query_security_request_pb.QuerySecurityRequestProto
    | undefined;
  setQuerySecurityInput(
    value?: fintekkers_requests_security_query_security_request_pb.QuerySecurityRequestProto
  ): QuerySecurityResponseProto;
  hasQuerySecurityInput(): boolean;
  clearQuerySecurityInput(): QuerySecurityResponseProto;

  getSecurityResponseList(): Array<fintekkers_models_security_security_pb.SecurityProto>;
  setSecurityResponseList(
    value: Array<fintekkers_models_security_security_pb.SecurityProto>
  ): QuerySecurityResponseProto;
  clearSecurityResponseList(): QuerySecurityResponseProto;
  addSecurityResponse(
    value?: fintekkers_models_security_security_pb.SecurityProto,
    index?: number
  ): fintekkers_models_security_security_pb.SecurityProto;

  getErrorsOrWarningsList(): Array<fintekkers_requests_util_errors_summary_pb.SummaryProto>;
  setErrorsOrWarningsList(
    value: Array<fintekkers_requests_util_errors_summary_pb.SummaryProto>
  ): QuerySecurityResponseProto;
  clearErrorsOrWarningsList(): QuerySecurityResponseProto;
  addErrorsOrWarnings(
    value?: fintekkers_requests_util_errors_summary_pb.SummaryProto,
    index?: number
  ): fintekkers_requests_util_errors_summary_pb.SummaryProto;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): QuerySecurityResponseProto.AsObject;
  static toObject(
    includeInstance: boolean,
    msg: QuerySecurityResponseProto
  ): QuerySecurityResponseProto.AsObject;
  static serializeBinaryToWriter(
    message: QuerySecurityResponseProto,
    writer: jspb.BinaryWriter
  ): void;
  static deserializeBinary(bytes: Uint8Array): QuerySecurityResponseProto;
  static deserializeBinaryFromReader(
    message: QuerySecurityResponseProto,
    reader: jspb.BinaryReader
  ): QuerySecurityResponseProto;
}

export namespace QuerySecurityResponseProto {
  export type AsObject = {
    objectClass: string;
    version: string;
    querySecurityInput?: fintekkers_requests_security_query_security_request_pb.QuerySecurityRequestProto.AsObject;
    securityResponseList: Array<fintekkers_models_security_security_pb.SecurityProto.AsObject>;
    errorsOrWarningsList: Array<fintekkers_requests_util_errors_summary_pb.SummaryProto.AsObject>;
  };
}
