# resend-promise
Retry and resend async/Promise requests

`resend-promise` exposes simple way to send async request with configurable retry mechanism.

# Install
```bash
  npm install resend-promise
```

# Usage
Simply pass your async function as parameter

```javascript
  import resend from "resend-promise";

  resend(() => fetch("https://reqres.in/data"))
  .then(response => {
    console.log(response)
  })
  .catch(console.log);
```

## Options
You can configure by send config object
```javascript

  async function callApi() {
    let config = {

      // this will be called after each API call
      // you can check the response and return true or false.
      // if returned false even when success, a retry will be sent.
      validate: (response) => response.isSuccess,

      // retry 5 times
      retries: 5,

      // delay one second
      delay: 1000,

      // backoff exponentially on each retry
      xBackOff: true
    }

    // fetchs data and retries 3 times with 300ms delay between each call
    let response = await resend(() => fetch("https://reqres.in/data"), config);
    console.log(response.ok); //
  }
```