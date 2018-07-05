import * as zlib from "zlib";
import * as lambda from "aws-lambda";
import { WebClient } from "@slack/client";
import { WebAPICallResult } from "@slack/client/dist/WebClient";
import { LambdaLogger } from "@nekonomokochan/aws-lambda-node-logger";

/**
 * Functions related to Slack notification are defined here
 */
export namespace SlackNotification {
  /**
   * sendMessage Request IF
   */
  interface ISendMessageRequest {
    event: lambda.CloudWatchLogsEvent;
    client: WebClient;
    channel: string;
  }

  /**
   * decodeLogs Response IF
   */
  interface IDecodedLogs {
    uncompressed: string;
    object: lambda.CloudWatchLogsDecodedData;
  }

  /**
   * @param {CloudWatchLogsEvent} event
   * @return {Promise<IDecodedLogs>}
   */
  const decodeLogs = (
    event: lambda.CloudWatchLogsEvent
  ): Promise<IDecodedLogs> => {
    return new Promise((resolve, reject) => {
      try {
        const base64Log = Buffer.from(event.awslogs.data, "base64");
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
   * Send Message to Slack Channel
   *
   * @param {SlackNotification.ISendMessageRequest} request
   * @return {Promise<any>}
   */
  export const sendMessage = async (request: ISendMessageRequest) => {
    try {
      const decodedLogs = await decodeLogs(request.event);

      if (!needsToNotify(decodedLogs)) {
        return Promise.resolve();
      }

      const params = {
        channel: request.channel,
        text: decodedLogs.uncompressed
      };

      return request.client.chat
        .postMessage(params)
        .then((result: WebAPICallResult) => {
          LambdaLogger.informational(result);
          return Promise.resolve(result);
        })
        .catch((error: Error) => {
          return Promise.reject(error);
        });
    } catch (error) {
      LambdaLogger.critical(error);
      return Promise.reject(error);
    }
  };

  /**
   * @return {string}
   */
  export const extractSlackTokenFromEnv = (): string => {
    const token = process.env.NOTIFICATION_SLACK_TOKEN;

    if (token === undefined) {
      return "";
    }

    return token;
  };

  /**
   * @return {string}
   */
  export const extractSlackChannelFromEnv = (): string => {
    const channel = process.env.NOTIFICATION_SLACK_CHANNEL;

    if (channel === undefined) {
      return "";
    }

    return channel;
  };
}
