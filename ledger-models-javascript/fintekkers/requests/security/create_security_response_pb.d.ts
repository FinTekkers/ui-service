import * as jspb from 'google-protobuf'

import * as fintekkers_models_security_security_pb from '../../../fintekkers/models/security/security_pb';
import * as fintekkers_requests_security_create_security_request_pb from '../../../fintekkers/requests/security/create_security_request_pb';
import * as fintekkers_requests_util_errors_summary_pb from '../../../fintekkers/requests/util/errors/summary_pb';


export class CreateSecurityResponseProto extends jspb.Message {
  getObjectClass(): string;
  setObjectClass(value: string): CreateSecurityResponseProto;

  getVersion(): string;
  setVersion(value: string): CreateSecurityResponseProto;

  getSecurityRequest(): fintekkers_requests_security_create_security_request_pb.CreateSecurityRequestProto | undefined;
  setSecurityRequest(value?: fintekkers_requests_security_create_security_request_pb.CreateSecurityRequestProto): CreateSecurityResponseProto;
  hasSecurityRequest(): boolean;
  clearSecurityRequest(): CreateSecurityResponseProto;

  getSecurityResponse(): fintekkers_models_security_security_pb.SecurityProto | undefined;
  setSecurityResponse(value?: fintekkers_models_security_security_pb.SecurityProto): CreateSecurityResponseProto;
  hasSecurityResponse(): boolean;
  clearSecurityResponse(): CreateSecurityResponseProto;

  getErrorsOrWarnings(): fintekkers_requests_util_errors_summary_pb.SummaryProto | undefined;
  setErrorsOrWarnings(value?: fintekkers_requests_util_errors_summary_pb.SummaryProto): CreateSecurityResponseProto;
  hasErrorsOrWarnings(): boolean;
  clearErrorsOrWarnings(): CreateSecurityResponseProto;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): CreateSecurityResponseProto.AsObject;
  static toObject(includeInstance: boolean, msg: CreateSecurityResponseProto): CreateSecurityResponseProto.AsObject;
  static serializeBinaryToWriter(message: CreateSecurityResponseProto, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): CreateSecurityResponseProto;
  static deserializeBinaryFromReader(message: CreateSecurityResponseProto, reader: jspb.BinaryReader): CreateSecurityResponseProto;
}

export namespace CreateSecurityResponseProto {
  export type AsObject = {
    objectClass: string,
    version: string,
    securityRequest?: fintekkers_requests_security_create_security_request_pb.CreateSecurityRequestProto.AsObject,
    securityResponse?: fintekkers_models_security_security_pb.SecurityProto.AsObject,
    errorsOrWarnings?: fintekkers_requests_util_errors_summary_pb.SummaryProto.AsObject,
  }
}

