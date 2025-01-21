const AWS = require('aws-sdk');
const fs = require('fs');

// Load environment variables (if using dotenv)
require('dotenv').config();

// Set up S3 configuration
const s3 = new AWS.S3({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION,
});

// Set up the parameters for the file download
const params = {
    Bucket: process.env.AWS_BUCKET_NAME, // The name of the S3 bucket
    Key: 'StudyNinja.pdf', // The key of the file (filename in S3 bucket)
};

// Specify the path where you want to save the downloaded file
const filePath = 'C:/Users/hassa/Desktop/Downloaded_StudyNinja.pdf';

// Download the file from S3
s3.getObject(params, (err, data) => {
    if (err) {
        console.log('Error downloading file:', err);
    } else {
        // Write the file to the local file system
        fs.writeFileSync(filePath, data.Body);
        console.log(`File downloaded successfully to ${filePath}`);
    }
});
