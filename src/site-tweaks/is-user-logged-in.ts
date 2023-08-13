//
// Infer whether we have a logged-in user
//

const cookieObject = document.cookie
  .split(";") // Split cookie string into "key=encodedValue" array
  .map((kv) => kv.split("=")) // Split each entry into [key, encodedValue]
  .map((kv) => [kv[0].trim(), decodeURIComponent(kv[1])]) // Remap [key, encodedValue] -> [trimmedKey, decodedValue]
  .reduce<Record<string, any>>((o, kv) => {
    // Accumulate list into a single object
    o[kv[0]] = kv[1];
    return o;
  }, {});

const isUserLoggedIn = "SiteUserInfo" in cookieObject;

export default isUserLoggedIn;
