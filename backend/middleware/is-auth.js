import jtw from "jsonwebtoken";

export const isAuthHandler = (req, res, next) => {
  const authHeader = req.get("Authorization");
  if (!authHeader) {
    const error = new Error("Not Authorization");
    error.statusCode = 401;
    throw error;
  }

  const token = authHeader.split(" ")[1];
  let decodedToken;
  try {
    decodedToken = jtw.verify(token, "secrectonlyinserver");
  } catch (e) {
    e.statusCode = 500;
    throw e;
  }

  if (!decodedToken) {
    const error = new Error("Not Authorization");
    error.statusCode = 500;
    throw error;
  }
  req.userId = decodedToken.userId;
  next();
};
