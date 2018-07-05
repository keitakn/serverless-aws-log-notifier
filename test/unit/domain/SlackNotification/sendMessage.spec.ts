import { SlackNotification } from "../../../../src/domain/SlackNotification";
import { WebClient } from "@slack/client";

describe("SlackNotification.sendMessage", () => {
  it("should send message to Slack's channel", async () => {
    const event = {
      awslogs: {
        data:
          "H4sIAAAAAAAAAKVSzU7cMBh8FSvqoZXIxr+xk9tSUoq0CxVJi1QWIZM4NN0kTm1nWYp49zqwLYdKLYhcIs1nz3wz47ugU9bKa1XcDipIg4N5Mb9cZnk+P8yCvUDf9Mp4GHOBuGAJjJnwcKuvD40eBz+J5I2NWtldVTKyymyUaT1h6NHQnwp77Zq6USas1CbsdLmeD80jQe6Mkt3EDZGIII8gjc7fLOZFlhcXvGaMllheQZVQhlnCME68fl0RUmKmPIUdr2xpmsE1uv/QtE4ZG6Tnwf92yFVfLXeWdd7Kcr3Q1zb/i+x9q8fqTLrym5+j8PgsS/gXtliij3Fw8WAg26jeTZp3QVN5H4QiwgilMOY4JknMaIIF44IQyIXgcSwExQgnCEOBMIaMcEaFgN6La3wLTnY+UMQIjH3YMYcx2vvdzi6mEPIQ0gKyFOOU8hmk/OvK0YTVXpGHvKYyREiJUEDIwrKuYlEziShJVm6+yE4LsOpBZow26eOv8LJg/xb8IzV/w3/SAbUdtHF2tmsRvI020kRO2nVkTRnJYYjqsS+nCCM7BTtzNsVJipJ3fziafqPXanfVjP1kPOp1pS47XY1ef3pOu9fU9JXazr57DhGnGD6RHD2QLGXvgzEzn5txL2REDKXTVsH93uvKQ88sLzs+AKfqx+gPHlUpeFZjr98OP3O70+zTiX8bL13QHYxGTnWnAJOZIKCzK7fftK2qwNMIQegHYOWWqtPmFuTNTzWhmILlvkflFuwmn63y0gQ94JP9i/tfZefQ9p8EAAA="
      }
    };

    const request = {
      event,
      client: new WebClient(SlackNotification.extractSlackTokenFromEnv()),
      channel: SlackNotification.extractSlackChannelFromEnv()
    };

    const result: any = await SlackNotification.sendMessage(request);

    expect(result.ok).toBe(true);
    expect(typeof result.channel).toBe("string");
    expect(typeof result.ts).toBe("string");
    expect(typeof result.message.text).toBe("string");
    expect(typeof result.message.username).toBe("string");
    expect(typeof result.message.bot_id).toBe("string");
    expect(result.message.type).toBe("message");
    expect(result.message.subtype).toBe("bot_message");
    expect(typeof result.message.ts).toBe("string");
    expect(result.scopes).toEqual(["identify", "chat:write:bot"]);
    expect(result.acceptedScopes).toEqual(["chat:write:bot"]);
  });

  it("should not send a Message", async () => {
    const event = {
      awslogs: {
        data:
          "H4sIAAAAAAAAAIWRzU/bQBDF/5Vo1SMr78fMfuRmtQYqJT1gCw4QVRt7nVrY3tR2girE/96hhRMHru+NfjPvzTMb4jyHQ6z+HCNbs295lf/cFmWZXxXsgqWnMU4kK+ukdeiFQUdynw5XUzodycnC05z1Ydg3IZvjdI5TT0BOKqcpPqala7s48Sae+ZDqx/zY/QeUyxTD8MoW0mXCZgKy+y+bvCrKamdbRKhV2IvoARV6VMrT/rbRulYYCTGf9nM9dcelS+Nl1y9xmtn6nn12QxnHZvsWOZV9qB836TCXH2Bf+3Rq7sJS/yJf8h93hbe3uNnKa8N2/wIU5zgurzufWddQDg1SowYQxiinrFZWgFQKHBpQABatFRasBEmutKi98AK0oixLR19YwkCFStTCUNnGCmkv3r9D+LLKb6rVTfx9otHvzXoFHltltOW2hcCljI47IZDXbWNci0GC9qtbqoUyrVdvzT6M7GX38hcmvdIx9gEAAA=="
      }
    };

    const request = {
      event,
      client: new WebClient(SlackNotification.extractSlackTokenFromEnv()),
      channel: SlackNotification.extractSlackChannelFromEnv()
    };

    const result = await SlackNotification.sendMessage(request);

    expect(result).toBeUndefined();
  });
});
