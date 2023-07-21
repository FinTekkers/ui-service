// Import the generated code
const { fintekkers } = require('./fintekkers/models/portfolio_pb');

// Create a new PortfolioProto object
const portfolio = new fintekkers.models.portfolio.PortfolioProto();

// Set the object properties
portfolio.setObjectClass('MyObjectClass');
portfolio.setVersion('1.0');
// ...

// Serialize the message to binary data
const binaryData = portfolio.serializeBinary();

// Deserialize the binary data back into a PortfolioProto object
const deserializedPortfolio = fintekkers.models.portfolio.PortfolioProto.deserializeBinary(binaryData);

// Access the properties of the deserialized object
console.log(deserializedPortfolio.getObjectClass());
console.log(deserializedPortfolio.getVersion());
// ...
