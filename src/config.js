import "dotenv/config";

export const config = {
  port: Number(process.env.PORT || 3000),
  uri: process.env.COGNODB_URI,
  username: process.env.COGNODB_USERNAME || "cognodb",
  password: process.env.COGNODB_PASSWORD
};

export function missingDatabaseConfig() {
  return !config.uri || !config.password;
}
