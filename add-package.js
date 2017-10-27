console.log('adding package to db');

const AWS = require('aws-sdk');
const docClient = new AWS.DynamoDB.DocumentClient({region:'ap-southeast-1'})

exports.handler = (event, context, callback) => {
    // TODO implement
    var params = {
        Item: {
            id: event.id,
            name: event.name,
            width: event.width,
            height: event.height,
            depth: event.depth,
            weight: event.weight,
            rotatable: event.rotatable,
            fragile: event.fragile,
            stackable: event.stackable
        },

        TableName: 'Package'
    };

    docClient.put(params, function(err, data){
        if (err) {
            callback(err, null);
        } else {
            callback(null, data);
        }
    })
};