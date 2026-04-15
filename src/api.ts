/**
 * 腾讯云 CodingPlan API 模块
 * 实现 TC3-HMAC-SHA256 签名算法和 API 调用
 */

import * as crypto from 'crypto';
import * as https from 'https';

// API 配置
const SERVICE = 'hunyuan';
const HOST = 'hunyuan.tencentcloudapi.com';
const REGION = 'ap-guangzhou';
const ACTION = 'DescribePkg';
const VERSION = '2023-09-01';

// 用量数据接口
export interface PeriodUsage {
  StartTime: string;
  EndTime: string;
  Total: number;
  Used: number;
  UsagePercent: number;
}

export interface PackageInfo {
  PkgName: string;
  PkgType: string;
  Price: number;
  Status: string;
  RemainingDays: number;
  UsagePercent: number;
  UsageDetail: {
    PerFiveHour: PeriodUsage;
    PerWeek: PeriodUsage;
    PerMonth: PeriodUsage;
  };
  StartTime: string;
  EndTime: string;
  ResourceId: string;
}

export interface APIResponse {
  Response?: {
    RequestId: string;
    PkgList: PackageInfo[];
  };
  error?: string;
}

export interface UsageData {
  success: boolean;
  error?: string;
  data?: {
    pkgName: string;
    pkgType: string;
    price: number;
    status: string;
    remainingDays: number;
    perFiveHour: PeriodUsage;
    perWeek: PeriodUsage;
    perMonth: PeriodUsage;
    startTime: string;
    endTime: string;
  };
}

/**
 * 计算 SHA256 哈希值
 */
function sha256Hash(content: string): string {
  return crypto.createHash('sha256').update(content).digest('hex');
}

/**
 * 计算 HMAC-SHA256
 */
function hmacSha256(key: Buffer | string, content: string): Buffer {
  return crypto.createHmac('sha256', key).update(content).digest();
}

/**
 * 计算 TC3 签名
 */
function getSignature(secretKey: string, date: string, service: string, stringToSign: string): string {
  const dateKey = hmacSha256(Buffer.from('TC3' + secretKey), date);
  const serviceKey = hmacSha256(dateKey, service);
  const signingKey = hmacSha256(serviceKey, 'tc3_request');
  const signature = crypto.createHmac('sha256', signingKey).update(stringToSign).digest('hex');
  return signature;
}

/**
 * 获取 CodingPlan 用量数据
 */
export async function getCodingPlanUsage(secretId: string, secretKey: string): Promise<UsageData> {
  const timestamp = Math.floor(Date.now() / 1000);
  const date = new Date(timestamp * 1000).toISOString().split('T')[0];

  const payload = JSON.stringify({});

  // 步骤1: 拼接规范请求串
  const canonicalHeaders = `content-type:application/json\nhost:${HOST}\n`;
  const signedHeaders = 'content-type;host';
  const canonicalRequest = `POST\n/\n\n${canonicalHeaders}\n${signedHeaders}\n${sha256Hash(payload)}`;

  // 步骤2: 拼接待签名字符串
  const algorithm = 'TC3-HMAC-SHA256';
  const credentialScope = `${date}/${SERVICE}/tc3_request`;
  const stringToSign = `${algorithm}\n${timestamp}\n${credentialScope}\n${sha256Hash(canonicalRequest)}`;

  // 步骤3: 计算签名
  const signature = getSignature(secretKey, date, SERVICE, stringToSign);

  // 步骤4: 拼接 Authorization
  const authorization = `${algorithm} Credential=${secretId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;

  // 构造请求头
  const headers: Record<string, string> = {
    'Authorization': authorization,
    'Content-Type': 'application/json',
    'Host': HOST,
    'X-TC-Action': ACTION,
    'X-TC-Timestamp': timestamp.toString(),
    'X-TC-Version': VERSION,
    'X-TC-Region': REGION,
  };

  // 发送 HTTPS 请求
  return new Promise((resolve) => {
    const req = https.request(
      {
        hostname: HOST,
        port: 443,
        path: '/',
        method: 'POST',
        headers,
        timeout: 15000,
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => {
          data += chunk;
        });
        res.on('end', () => {
          try {
            const result: APIResponse = JSON.parse(data);
            if (result.error) {
              resolve({ success: false, error: result.error });
              return;
            }
            if (!result.Response?.PkgList?.length) {
              resolve({ success: false, error: '未找到套餐信息' });
              return;
            }

            const pkg = result.Response.PkgList[0];
            resolve({
              success: true,
              data: {
                pkgName: pkg.PkgName,
                pkgType: pkg.PkgType,
                price: pkg.Price,
                status: pkg.Status,
                remainingDays: pkg.RemainingDays,
                perFiveHour: pkg.UsageDetail.PerFiveHour,
                perWeek: pkg.UsageDetail.PerWeek,
                perMonth: pkg.UsageDetail.PerMonth,
                startTime: pkg.StartTime,
                endTime: pkg.EndTime,
              },
            });
          } catch (e) {
            resolve({ success: false, error: `解析响应失败: ${e}` });
          }
        });
      }
    );

    req.on('error', (e) => {
      resolve({ success: false, error: `请求失败: ${e.message}` });
    });

    req.on('timeout', () => {
      req.destroy();
      resolve({ success: false, error: '请求超时' });
    });

    req.write(payload);
    req.end();
  });
}
