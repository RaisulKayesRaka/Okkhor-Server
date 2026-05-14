const swaggerAutogen = require("swagger-autogen")();

const doc = {
  info: {
    title: "Okkhor API",
    description: "API documentation for the Okkhor server",
  },
  host: "localhost:5000",
};

const outputFile = "./swagger-output.json";
const routes = ["./index.js"];

/* NOTE: if you use the express Router, you must pass in the 
   'endpointsFiles' only the root file where the route starts,
   such as index.js, app.js, routes.js, ... */

swaggerAutogen(outputFile, routes, doc);
