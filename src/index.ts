var wait = (time: number) => new Promise(resolve => setTimeout(resolve, time || 0));

export interface IRetryParamsConfig {
  /**
   * Number of retries when request fails or user invalidates, default: 3
   */
  retries?: number;
  /**
   * Number of milliseconds to backoff retry, default: 300
   */
  delay?: number;
  /**
   * Enable exponential backoff, default: false
   */
  xBackOff?: boolean;
  /**
   * Exponent number for xBackOff, default: 2
   */
  backOffBy?: number;
}

export type RetryValidator<T> = (res: T, params: Partial<IRetryParamsConfig>) => boolean;

export interface IRetryParams<T> extends IRetryParamsConfig{
  validate?: RetryValidator<T>;
}

const RETRIES = 3;
const DELAY = 300;
const X_BACK_OFF = false;
const BACK_OFF_BY = 2;

/**
 * resend calls your async functions and retires based on IRetryParams
 * @param fn async function
 * @param params
 * @returns {Promise<T>}
 */
export function resend<T>(fn: () => Promise<T>, params: IRetryParams<T> = {
   delay: 300, retries: 3, xBackOff: false, backOffBy: 2
}) {
  let progress = 0;
  return new Promise(async (resolve: (value: T) => void, reject) => {
    if (fn instanceof Promise) reject(new Error("fn should be promise"));

    (async function runWithRetry(rFn: () => Promise<any>, rParams: IRetryParams<T>) {

      let {validate, retries, delay, xBackOff, backOffBy} = rParams;
      if (!delay) delay = DELAY;
      if (!retries) retries = RETRIES;
      if (!xBackOff) xBackOff = X_BACK_OFF;
      if (!backOffBy) backOffBy = BACK_OFF_BY;

      let currentDelay = xBackOff ? (backOffBy ** progress * delay) : delay;

      try {
          var fnRes: T = await rFn();

          if (!validate) return resolve(fnRes);

          if (progress+1 === retries) return resolve(fnRes);

          if (validate(fnRes, {retries, delay: currentDelay}) == true) {
              // clean up the while loop
              progress = retries;
              resolve(fnRes);
          } else {
              if (progress == retries) {
                return reject(new Error("last retry rejected"));
              }
          }

      } catch(err) {
          if (progress == retries) {
            return reject(err);
          }
      }

      await wait(currentDelay);

      progress++;
      await runWithRetry(rFn, rParams);

    })(fn, params as IRetryParams<T>);

    // runWithRetry(fn, params);

  });

}
