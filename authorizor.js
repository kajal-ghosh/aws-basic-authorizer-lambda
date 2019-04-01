// Load the AWS SDK for Node.js
var AWS = require('aws-sdk');
// Set the region 
AWS.config.update({ region: 'us-east-2' });
// Create the DynamoDB service object
var ddb = new AWS.DynamoDB({ apiVersion: '2012-08-10' });

exports.handler = function(event, context, callback) {
  validateTokenAndRespond(event, callback);
};

function validateTokenAndRespond(event, callback) {
  var secretKeyArray = event.authorizationToken.split(" ");
  var isValid = false;
  if (secretKeyArray.length == 2) {
    var secretKey = secretKeyArray[1].trim();

    var dynamoDBParams = {
      TableName: 'MySecretLatest',
      Key: {
        'secretKey': { S: secretKey }
      },
      ProjectionExpression: 'secretKey'
    };

    ddb.getItem(dynamoDBParams, function(err, data) {
      var effect = 'Deny';
      if (err) {
        console.log("Error", err);
      }
      else {
        console.log("Success", data.Item);
        if (data.Item != undefined) {
          console.log("Entry found in DB");
          effect = 'Allow';
        }
      }
      sendResponse(callback, event, effect);
    });
  }
  else {
    sendResponse(callback, event, 'Deny');
  }
}

function sendResponse(callback, event, effect) {
  callback(
    null, {
      "principalId": "user",
      "policyDocument": {
        "Version": "2012-10-17",
        "Statement": [{
          "Action": "execute-api:Invoke",
          "Effect": effect,
          "Resource": event.methodArn
        }]
      }
    }
  );
}
