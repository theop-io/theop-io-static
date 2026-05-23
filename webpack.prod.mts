import type { Configuration } from "webpack";
import { merge } from "webpack-merge";

import commonConfiguration from "./webpack.common.mts";

const prodConfiguration: Configuration = {
  mode: "production",
};

const config = merge(commonConfiguration, prodConfiguration);
export default config;
