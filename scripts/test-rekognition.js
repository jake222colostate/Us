import { RekognitionClient, DetectModerationLabelsCommand } from "@aws-sdk/client-rekognition";
import { readFileSync } from "fs";

const region = process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || "us-east-1";
const client = new RekognitionClient({ region });

const img = readFileSync("/tmp/test_small.jpg");
const cmd = new DetectModerationLabelsCommand({
  Image: { Bytes: img },
  MinConfidence: 60
});

client.send(cmd)
  .then(res => { console.log(JSON.stringify(res, null, 2)); })
  .catch(err => { console.error("SDK error:", err); process.exit(1); });
