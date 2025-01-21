const AWS = require('aws-sdk');
const fs = require('fs');
const path = require('path');

require('dotenv').config();

const s3 = new AWS.S3({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION,
});

const uploadFile = async (fileBuffer, fileName, contentType) => {
    console.log('Uploading file');
    try {
        const fileExtension = fileName.split('.').pop().toLowerCase();
        if (!contentType) {
            switch (fileExtension) {
                case 'pdf':
                    contentType = 'application/pdf';
                    break;
                case 'doc':
                case 'docx':
                    contentType = 'application/msword';
                    break;
                default:
                    contentType = 'application/octet-stream';
                    break;
            }
        }

        const params = {
            Bucket: process.env.AWS_BUCKET_NAME,
            Key: fileName,
            Body: fileBuffer, // Directly use the buffer from req.files
            ContentType: contentType,
        };

        const data = await s3.upload(params).promise();
        console.log("File uploaded successfully! URL: ", data.Location);
        return data.Location;
    } catch (err) {
        console.error('Error uploading file:', err.message);
        throw err; // Propagate the error
    }
};


const downloadFile = async (fileName, downloadPath) => {
    try {
        const params = {
            Bucket: process.env.AWS_BUCKET_NAME,
            Key: fileName,
        };

        const data = await s3.getObject(params).promise();

        const filePath = path.join(downloadPath, fileName);

        fs.writeFileSync(filePath, data.Body);
        console.log(`File downloaded successfully to ${filePath}`);
    } catch (err) {
        console.error('Error downloading file:', err.message);
    }
};

module.exports = { uploadFile, downloadFile };
