const { loadPackageDefinition, credentials } = require('@grpc/grpc-js');
const { loadSync } = require('@grpc/proto-loader');

class ProtoClient {
  constructor(opts) {
    this.protoFilePath = opts.protoFilePath;
    this.host = opts.host;
    this.port = opts.port;
    this.packageName = opts.packageName;
    this.isShowLog = !!opts.isShowLog;
  }

  request(serviceName, methodName, params) {
    return new Promise((resolve, reject) => {
      const packageDefinition = loadSync(
        this.protoFilePath,
        {
          keepCase: true,
          longs: String,
          enums: String,
          defaults: true,
          oneofs: true,
        },
      );
      const currentProto = loadPackageDefinition(packageDefinition)[this.packageName];
      const client = new currentProto[serviceName](
        `${this.host}:${this.port}`,
        credentials.createInsecure(),
      );
      if (client[methodName]) {
        client[methodName](params, (err, response) => {
          if (this.isShowLog) {
            console.dir({
              req: params,
              resp: { err, response }
            }, { depth: 5 });
          }

          if (err) {
            reject(err);
          }
          resolve(response);
        })
      }
    });
  }
}

module.exports = ProtoClient;
