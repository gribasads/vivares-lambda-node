const Post = require("../models/Post");
const db = require("../utils/db");
const AWS = require('aws-sdk');
const { v4: uuidv4 } = require('uuid');

const s3 = new AWS.S3({
  region: 'us-east-1',
  signatureVersion: 'v4',
  s3ForcePathStyle: true
});

const createResponse = (statusCode, body) => ({
  statusCode,
  headers: {
    'Access-Control-Allow-Origin': process.env.STAGE === 'local' ? 'http://localhost:3001' : 'https://vivares-web.vercel.app',
    'Access-Control-Allow-Credentials': true,
    'Access-Control-Allow-Headers': 'Content-Type,Token,token,Authorization,X-Amz-Date,X-Api-Key,X-Amz-Security-Token,X-Amz-User-Agent',
    'Access-Control-Allow-Methods': 'OPTIONS,POST,GET,PUT,DELETE'
  },
  body: JSON.stringify(body)
});

exports.uploadImage = async (event) => {
  try {
    const base64Data = event.body.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');
    const fileExtension = event.headers['Content-Type'].split('/')[1];
    const fileName = `${uuidv4()}.${fileExtension}`;

    const params = {
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: `posts/${fileName}`,
      Body: buffer,
      ContentType: `image/${fileExtension}`,
      ACL: 'public-read'
    };

    const result = await s3.upload(params).promise();
    return createResponse(200, { url: result.Location });
  } catch (error) {
    return createResponse(500, { error: error.message });
  }
};

exports.createPost = async (event) => {
  try {
    await db.ensureConnection();
    const postData = JSON.parse(event.body);
    const post = new Post(postData);
    await post.save();
    return createResponse(201, post);
  } catch (error) {
    return createResponse(500, { error: error.message });
  }
};

exports.getPosts = async (event) => {
  try {
    await db.ensureConnection();
    const posts = await Post.find()
      .populate('author', 'name email')
      .sort({ createdAt: -1 });
    return createResponse(200, posts);
  } catch (error) {
    return createResponse(500, { error: error.message });
  }
};

exports.getPost = async (event) => {
  try {
    await db.ensureConnection();
    const post = await Post.findById(event.pathParameters.id)
      .populate('author', 'name email');
    if (!post) {
      return createResponse(404, { error: "Post não encontrado" });
    }
    return createResponse(200, post);
  } catch (error) {
    return createResponse(500, { error: error.message });
  }
};

exports.updatePost = async (event) => {
  try {
    await db.ensureConnection();
    const post = await Post.findByIdAndUpdate(
      event.pathParameters.id,
      JSON.parse(event.body),
      { new: true }
    ).populate('author', 'name email');
    
    if (!post) {
      return createResponse(404, { error: "Post não encontrado" });
    }
    return createResponse(200, post);
  } catch (error) {
    return createResponse(500, { error: error.message });
  }
};

exports.deletePost = async (event) => {
  try {
    await db.ensureConnection();
    const post = await Post.findById(event.pathParameters.id);
    
    if (!post) {
      return createResponse(404, { error: "Post não encontrado" });
    }

    if (post.images && post.images.length > 0) {
      const deletePromises = post.images.map(imageUrl => {
        const key = imageUrl.split('/').pop();
        return s3.deleteObject({
          Bucket: process.env.AWS_BUCKET_NAME,
          Key: `posts/${key}`
        }).promise();
      });
      await Promise.all(deletePromises);
    }

    await post.deleteOne();
    return createResponse(200, { message: "Post removido com sucesso" });
  } catch (error) {
    return createResponse(500, { error: error.message });
  }
};

exports.uploadPostImage = async (event) => {
  try {
    const contentType = event.headers['Content-Type'] || event.headers['content-type'];
    if (!contentType) {
      return createResponse(415, { error: "Content-Type não especificado" });
    }
    if (!contentType.startsWith('image/')) {
      return createResponse(415, { error: "O arquivo deve ser uma imagem" });
    }
    let base64Data = event.body;
    if (base64Data.startsWith('data:image')) {
      base64Data = base64Data.replace(/^data:image\/\w+;base64,/, '');
    }
    const buffer = Buffer.from(base64Data, 'base64');
    const fileExtension = contentType.split('/')[1];
    const fileName = `${uuidv4()}.${fileExtension}`;
    const params = {
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: `posts/${fileName}`,
      Body: buffer,
      ContentType: contentType
    };
    const result = await s3.upload(params).promise();
    return createResponse(200, { url: result.Location });
  } catch (error) {
    return createResponse(500, { error: error.message });
  }
}; 