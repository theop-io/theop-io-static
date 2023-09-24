//
// Infer whether we have a logged-in user
//

// Cookie processing the cheap and simple way, which is all we should need
// - Check if a potential Memberspace JWT-style access token is present in our cookies
const isUserLoggedIn = document.cookie.includes("_ms-access-token");

// Cookie processing the comprehensive way
// const cookieObject = document.cookie
//   .split(";") // Split cookie string into "key=encodedValue" array
//   .map((kv) => kv.split("=")) // Split each entry into [key, encodedValue]
//   .map((kv) => [kv[0].trim(), decodeURIComponent(kv[1])]) // Remap [key, encodedValue] -> [trimmedKey, decodedValue]
//   .reduce<Record<string, any>>((o, kv) => {
//     // Accumulate list into a single object
//     o[kv[0]] = kv[1];
//     return o;
//   }, {});

// // Check if a Memberspace JWT-style access token is present in our cookies
// const isUserLoggedIn = "_ms-access-token" in cookieObject;

export default isUserLoggedIn;
