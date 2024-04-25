import path from "node:path";
import url from "node:url";

export default {
  path: path.dirname(url.fileURLToPath(import.meta.url)) + "/../",
  title: "Savevest Open Api Project",
  version: "1.0.0",
  tagIndex: 2,
  
  snakeCase: true,
  ignore: ["/swagger", "/docs"],
  preferredPutPatch: "PUT",
  common: {
    parameters: {},
    headers: {},
  },
  persistAuthorization: true,
  showFullPath: false,
  openapi: '3.0.0',
  security: [{
    bearerAuth: [],
  }],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
  },
};
