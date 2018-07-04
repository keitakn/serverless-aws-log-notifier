export namespace ServerlessUtility {
  /**
   * @param event
   * @return {boolean}
   */
  export const isWarmupRequest = (event: any) => {
    if (!("source" in event)) {
      return false;
    }

    return event.source === "serverless-plugin-warmup";
  };
}
