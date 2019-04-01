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

    let decodedData = Buffer.from(secretKey, 'base64').toString('ascii'); // output string in ascii character encoding. utf8 & other encoding can also be used
    console.log('decodedData:' + decodedData); // output: Hello World
    if (decodedData.indexOf(":") == -1) {
      sendResponse(callback, event, 'Deny');
    }
    else {
      var decodedDataArray = decodedData.split(":");
      var dynamoDBParams = {
        TableName: 'MySecret',
        Key: {
          'username': { S: decodedDataArray[0] }
        },
        ProjectionExpression: 'password'
      };

      ddb.getItem(dynamoDBParams, function(err, data) {
        var effect = 'Deny';
        if (err) {
          console.log("Error", err);
        }
        else {
          if (data.Item != undefined && data.Item.password.S == decodedDataArray[1]) {
            console.log("Success");
            effect = 'Allow';
          }
        }
        sendResponse(callback, event, effect);
      });
    }
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
