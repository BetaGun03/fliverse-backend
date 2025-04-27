// This file contains the configuration for Azure Storage Blob service
require('dotenv').config()
const { BlobServiceClient } = require('@azure/storage-blob')

const blobServiceClient = BlobServiceClient.fromConnectionString(process.env.AZURE_STORAGE_CONNECTION_STRING)

async function getContainerClient() 
{
  const client = blobServiceClient.getContainerClient(process.env.AZURE_STORAGE_CONTAINER_NAME)
  await client.createIfNotExists({ access: 'blob' })
  return client
}

module.exports = { getContainerClient }
