import * as yup from "yup";

export const theReelsDbRoot = "./src/the-reels/data";

export const vimeoLinkRegex = /^https:\/\/vimeo\.com\/(\d+)(\?.*)?$/;

const reelOperatorContactInfo = yup.object({
  email: yup.string(),
  instagram: yup.string(),
  url: yup.string(),
});

export type ReelOperatorContactInfo = yup.InferType<typeof reelOperatorContactInfo>;

export const reelFileSchema = yup
  .object({
    operatorName: yup.string().required(),
    memberships: yup.array().of(yup.string().required()),
    operatorActiveSinceYear: yup.number().integer().required(),
    operatorContactInfo: reelOperatorContactInfo,
    vimeoLink: yup.string().matches(vimeoLinkRegex),
  })
  .required();

export type ReelFile = yup.InferType<typeof reelFileSchema>;
