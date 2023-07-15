// // Import the client and the message definition
// import { SecurityProto } from './web/fintekkers/models/security/security_pb';
// import { SecurityServiceClient } from './web/fintekkers/models/security/v1/security_service_grpc_web_pb';
// import { QuerySecurityRequestProto } from './web/fintekkers/requests/security/query_security_request_pb';
// import { QuerySecurityResponseProto } from './web/fintekkers/requests/security/query_security_response_pb';

// // Connect to the gprc-web server  
// const client = new SecurityServiceClient("http://api.fintekkers.org:8082", null, null);
// // This is a neat chrome extension that allows you to spy on grpc-web traffic just like you would on normal traffic.
// // You can find it here: https://chrome.google.com/webstore/detail/grpc-web-developer-tools/ddamlpimmiapbcopeoifjfmoabdbfbjj?hl=en
// const enableDevTools = window.__GRPCWEB_DEVTOOLS__ || (() => {});
// enableDevTools([
//   client,
// ]);

// // Send getCurrentTime request
// client.SearchSecuritiesRequest(new QuerySecurityRequestProto(), {}, (err, response) => {
//     // const a = new QuerySecurityResponseProto();
    
//   // handle the response
//   this.lastTimeResponse = response.getObjectClass();
//   console.log(lastTimeResponse);
// });