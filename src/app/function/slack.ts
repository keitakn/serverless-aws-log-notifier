import * as lambda from "aws-lambda";
import * as sourceMapSupport from "source-map-support";
import { WebClient } from "@slack/client";
import * as zlib from "zlib";
import { WebAPICallResult } from "@slack/client/dist/WebClient";
import { LambdaLogger } from "@nekonomokochan/aws-lambda-node-logger";
import { ServerlessUtility } from "../../infrastructure/ServerlessUtility";

sourceMapSupport.install();

/**
 * 動作確認用のモックAPI
 *
 * @param {APIGatewayEvent} event
 * @param {Context} context
 * @param {Callback} callback
 */
export const mockApi = (
  event: lambda.APIGatewayEvent,
  context: lambda.Context,
  callback: lambda.Callback
) => {
  if (ServerlessUtility.isWarmupRequest(event)) {
    return callback();
  }

  if (event.queryStringParameters) {
    const error = new Error("ErrorTest By serverless-aws-log-notifier");
    LambdaLogger.alert(error);
  }

  const response = {
    statusCode: 200,
    headers: { "x-request-id": context.awsRequestId },
    body: JSON.stringify({ message: "Slack API Mock" })
  };

  callback(undefined, response);
};

interface IDecodedLogs {
  uncompressed: string;
  object: lambda.CloudWatchLogsDecodedData;
}

/**
 * ログをデコードする
 *
 * @param {CloudWatchLogsEvent} event
 * @return {Promise<IDecodedLogs>}
 */
const decodeLogs = (
  event: lambda.CloudWatchLogsEvent
): Promise<IDecodedLogs> => {
  return new Promise((resolve, reject) => {
    try {
      const base64Log = new Buffer(event.awslogs.data, "base64");
      zlib.gunzip(base64Log, (error: Error | null, result: Buffer) => {
        if (error) {
          reject(error);
        }

        const uncompressedLogs = result.toString("ascii");

        const logsObject: lambda.CloudWatchLogsDecodedData = <any>(
          JSON.parse(uncompressedLogs)
        );

        const decodedLogs = {
          uncompressed: uncompressedLogs,
          object: logsObject
        };

        resolve(decodedLogs);
      });
    } catch (error) {
      reject(error);
    }
  });
};

/**
 * Slack用のトークンを環境変数から抽出する
 *
 * @return {string}
 */
const extractSlackTokenFromEnv = (): string => {
  const token = process.env.NOTIFICATION_SLACK_TOKEN;

  if (token === undefined) {
    return "";
  }

  return token;
};

/**
 * Slack用のChannelを環境変数から抽出する
 *
 * @return {string}
 */
const extractSlackChannelFromEnv = (): string => {
  const channel = process.env.NOTIFICATION_SLACK_CHANNEL;

  if (channel === undefined) {
    return "";
  }

  return channel;
};

/**
 * 通知する必要があるか判定する
 *
 * @param {IDecodedLogs} decodedLogs
 * @return {boolean}
 */
const needsToNotify = (decodedLogs: IDecodedLogs): boolean => {
  const notifiedList = decodedLogs.object.logEvents.filter(
    (event: lambda.CloudWatchLogsLogEvent) => {
      return event.message != null && event.message.indexOf("ALERT") !== -1;
    }
  );

  return notifiedList.length !== 0;
};

/**
 * Slackにmessageを送信する
 *
 * @param {CloudWatchLogsEvent} event
 * @param {Context} context
 * @param {Callback} callback
 * @return {Promise<void>}
 */
export const sendMessage = async (
  event: lambda.CloudWatchLogsEvent,
  context: lambda.Context,
  callback: lambda.Callback
) => {
  try {
    if (ServerlessUtility.isWarmupRequest(event)) {
      return callback();
    }

    const decodedLogs = await decodeLogs(event);

    if (!needsToNotify(decodedLogs)) {
      return callback();
    }

    const token = extractSlackTokenFromEnv();
    const webClient = new WebClient(token);
    const conversationId = extractSlackChannelFromEnv();

    const messages = {
      channel: conversationId,
      text: decodedLogs.uncompressed
    };
    webClient.chat
      .postMessage(messages)
      .then((result: WebAPICallResult) => {
        LambdaLogger.informational(result);
        callback();
      })
      .catch((error: Error) => {
        callback(error);
      });
  } catch (error) {
    LambdaLogger.critical(error);
  }
};
