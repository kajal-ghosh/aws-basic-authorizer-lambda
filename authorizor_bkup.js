// Load the AWS SDK for Node.js
var AWS = require('aws-sdk');
// Set the region
AWS.config.update({ region: 'us-east-2' });

// Create the DynamoDB service object
var ddb = new AWS.DynamoDB({ apiVersion: '2012-08-10' });

exports.handler = function(event, context, callback) {
  var effect = 'Deny';
  var secretKeyArray = event.authorizationToken.split(" ");
  var secretKey = secretKeyArray[1].trim();

  var methodArn = event.methodArn;
  var responseBody = {
    "principalId": "user",
    "policyDocument": {
      "Version": "2012-10-17",
      "Statement": [{
        "Action": "execute-api:Invoke",
        "Effect": effect,
        "Resource": methodArn
      }]
    }
  };

  var params = {
    TableName: 'MySecretLatest',
    Key: {
      'secretKey': { S: secretKey }
    },
    ProjectionExpression: 'secretKey'
  };

  // Call DynamoDB to read the item from the table
  ddb.getItem(params, function(err, data) {
    if (err) {
      console.log("Error", err);
      callback(err, responseBody);
    }
    else {
      console.log("Success", data.Item);
      // responseBody =  "Success";
      effect = "Allow";
      if (data.Item == undefined) {
        console.log("No entry found in DB");
        callback(null, responseBody);
      }
      else {
        console.log("Entry found in DB");
        responseBody = {
          "principalId": "user",
          "policyDocument": {
            "Version": "2012-10-17",
            "Statement": [{
              "Action": "execute-api:Invoke",
              "Effect": "Allow",
              "Resource": methodArn
            }]
          }
        };
        callback(null, responseBody);
      }
    }
  });
};
