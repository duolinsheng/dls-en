import { CHAT_SYSTEM_PROMPT, DIALECTS, localZhToShMap, localZhToYueMap } from '../../metadata.js';

export const getConfig = (req, res) => {
  res.json({
    CHAT_SYSTEM_PROMPT,
    DIALECTS,
    localMaps: {
      sh: localZhToShMap,
      yue: localZhToYueMap
    }
  });
};
