import resend, { IRetryParamsConfig, RetryValidator } from "./resend";

interface ReFetch<T> {
  validate: (validatorFunction: RetryValidator<T>) => ReFetch<T>;
  withRetry: (config?: IRetryParamsConfig | undefined) => ReFetch<T>;
  send: () => Promise<Response>
}

const fej = (function Fej(input: RequestInfo, init?: RequestInit) {
  let retryParams: IRetryParamsConfig = {
    delay: 300, retries: 3, xBackOff: false, backOffBy: 2
  };

  const ReFetch = function<T> (
    this: ReFetch<T>
  ) {

    let validator: RetryValidator<T>;

    this.validate = function(validatorFunction: RetryValidator<T>) {
      validator = validatorFunction;

      return this;
    }

    this.withRetry = function(config?: IRetryParamsConfig | undefined) {
      retryParams = Object.assign({}, retryParams, config || {});

      return this;
    }

    this.send = async function():Promise<Response> {
      console.log(Object.assign({}, retryParams, { validator }))
      return resend(
        // fetch request
        () => fetch(input, init),

        // add retryParams to validator
        Object.assign({}, retryParams, { validator })
      );
    }

  } as any as { new (): ReFetch<Response>; };

  return new ReFetch();
});

export default fej;