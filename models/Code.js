const db = require("../utils/db");

exports.saveCode = async (email, code) => {
  const client = await db.connect();
  const collection = client.db("vivares").collection("codes");

  await collection.insertOne({
    email,
    code,
    createdAt: new Date(),
  });
};
