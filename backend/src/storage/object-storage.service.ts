import { Injectable, InternalServerErrorException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { createHash, createHmac } from "crypto";

@Injectable()
export class ObjectStorageService {
  private readonly endpoint: string;
  private readonly accessKey: string;
  private readonly secretKey: string;
  private readonly bucket: string;
  private readonly region: string;

  constructor(private readonly config: ConfigService) {
    this.endpoint = (this.config.get<string>("MINIO_ENDPOINT") || "http://minio:9000").replace(/\/$/, "");
    this.accessKey = this.config.get<string>("MINIO_ACCESS_KEY") || "bluecollar";
    this.secretKey = this.config.get<string>("MINIO_SECRET_KEY") || "bluecollar_minio_password";
    this.bucket = this.config.get<string>("MINIO_BUCKET") || "worker-documents";
    this.region = this.config.get<string>("MINIO_REGION") || "us-east-1";
  }

  async putObject(key: string, body: Buffer, contentType: string): Promise<string> {
    await this.ensureBucket();
    await this.request("PUT", `/${this.bucket}/${this.encodeKey(key)}`, body, { "content-type": contentType });
    return key;
  }

  async deleteObject(key: string) {
    await this.request("DELETE", `/${this.bucket}/${this.encodeKey(key)}`);
  }

  async getSignedUrl(key: string, expiresInSeconds = 900) {
    const expires = Math.min(604800, Math.max(1, expiresInSeconds));
    const url = new URL(`${this.endpoint}/${this.bucket}/${this.encodeKey(key)}`);
    const now = new Date();
    const amzDate = this.formatAmzDate(now);
    const shortDate = amzDate.slice(0, 8);
    const credentialScope = `${shortDate}/${this.region}/s3/aws4_request`;
    const credential = `${this.accessKey}/${credentialScope}`;
    const host = url.host;
    const canonicalUri = this.canonicalUri(url.pathname);

    const params = new URLSearchParams();
    params.set("X-Amz-Algorithm", "AWS4-HMAC-SHA256");
    params.set("X-Amz-Credential", credential);
    params.set("X-Amz-Date", amzDate);
    params.set("X-Amz-Expires", String(expires));
    params.set("X-Amz-SignedHeaders", "host");

    const canonicalRequest = [
      "GET",
      canonicalUri,
      this.canonicalQuery(params),
      `host:${host}\n`,
      "host",
      "UNSIGNED-PAYLOAD",
    ].join("\n");

    const stringToSign = ["AWS4-HMAC-SHA256", amzDate, credentialScope, this.sha256(canonicalRequest)].join("\n");
    params.set("X-Amz-Signature", this.sign(stringToSign, shortDate));
    return `${url.origin}${canonicalUri}?${this.canonicalQuery(params)}`;
  }

  private async ensureBucket() {
    const response = await this.request("PUT", `/${this.bucket}`, undefined, {}, true);
    if (![200, 204, 400, 403, 409].includes(response.status)) {
      throw new InternalServerErrorException(`Unable to initialize object storage bucket (${response.status})`);
    }
  }

  private async request(method: string, path: string, body?: Buffer, extraHeaders: Record<string, string> = {}, allowErrorStatus = false) {
    const url = new URL(`${this.endpoint}${path}`);
    const payloadHash = body ? this.sha256(body) : this.sha256("");
    const amzDate = this.formatAmzDate(new Date());
    const shortDate = amzDate.slice(0, 8);
    const host = url.host;
    const canonicalUri = this.canonicalUri(url.pathname);
    const headers: Record<string, string> = {
      host,
      "x-amz-content-sha256": payloadHash,
      "x-amz-date": amzDate,
      ...Object.fromEntries(Object.entries(extraHeaders).map(([name, value]) => [name.toLowerCase(), value])),
    };

    const signedHeaderNames = Object.keys(headers).sort();
    const canonicalHeaders = signedHeaderNames.map((name) => `${name}:${headers[name].trim()}\n`).join("");
    const signedHeaders = signedHeaderNames.join(";");
    const canonicalRequest = [method, canonicalUri, "", canonicalHeaders, signedHeaders, payloadHash].join("\n");
    const credentialScope = `${shortDate}/${this.region}/s3/aws4_request`;
    const stringToSign = ["AWS4-HMAC-SHA256", amzDate, credentialScope, this.sha256(canonicalRequest)].join("\n");
    const authorization = [
      `AWS4-HMAC-SHA256 Credential=${this.accessKey}/${credentialScope}`,
      `SignedHeaders=${signedHeaders}`,
      `Signature=${this.sign(stringToSign, shortDate)}`,
    ].join(", ");

    const response = await fetch(url, {
      method,
      headers: { ...headers, authorization },
      body: body ? new Uint8Array(body) : undefined,
    });

    if (!response.ok && !allowErrorStatus) {
      const errorBody = await response.text().catch(() => "");
      throw new InternalServerErrorException(`Object storage request failed (${response.status})${errorBody ? `: ${errorBody.slice(0, 300)}` : ""}`);
    }

    return response;
  }

  private encodeKey(key: string) {
    return key.split("/").map((segment) => encodeURIComponent(segment)).join("/");
  }

  private canonicalUri(pathname: string) {
    return pathname.split("/").map((segment) => (segment ? encodeURIComponent(decodeURIComponent(segment)) : "")).join("/");
  }

  private canonicalQuery(params: URLSearchParams) {
    return [...params.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([name, value]) => `${encodeURIComponent(name)}=${encodeURIComponent(value)}`).join("&");
  }

  private sha256(value: string | Buffer) {
    return createHash("sha256").update(value).digest("hex");
  }

  private sign(stringToSign: string, shortDate: string) {
    const kDate = createHmac("sha256", `AWS4${this.secretKey}`).update(shortDate).digest();
    const kRegion = createHmac("sha256", kDate).update(this.region).digest();
    const kService = createHmac("sha256", kRegion).update("s3").digest();
    const kSigning = createHmac("sha256", kService).update("aws4_request").digest();
    return createHmac("sha256", kSigning).update(stringToSign).digest("hex");
  }

  private formatAmzDate(date: Date) {
    return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
  }
}
