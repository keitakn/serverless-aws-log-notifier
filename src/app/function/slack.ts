import * as lambda from "aws-lambda";
import * as sourceMapSupport from "source-map-support";
import { WebClient } from "@slack/client";
import { LambdaLogger } from "@nekonomokochan/aws-lambda-node-logger";
import { ServerlessUtility } from "../../infrastructure/ServerlessUtility";
import { SlackNotification } from "../../domain/SlackNotification";

sourceMapSupport.install();

/**
 * Mock API for testing
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

/**
 * Notify To Slack
 *
 * @param {CloudWatchLogsEvent} event
 * @param {Context} context
 * @param {Callback} callback
 * @return {Promise<void>}
 */
export const notify = async (
  event: lambda.CloudWatchLogsEvent,
  context: lambda.Context,
  callback: lambda.Callback
) => {
  try {
    if (ServerlessUtility.isWarmupRequest(event)) {
      return callback();
    }

    const token = SlackNotification.extractSlackTokenFromEnv();
    const client = new WebClient(token);
    const channel = SlackNotification.extractSlackChannelFromEnv();

    const request = {
      event,
      client,
      channel
    };

    await SlackNotification.sendMessage(request);
  } catch (error) {
    LambdaLogger.critical(error);
  }
};
