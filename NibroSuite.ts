//@ts-ignore
import { getGitCommitHash, getBuildTime, getVersion } from './src/lib/macros' with { type: 'macro' };

import NibroCardUtils from "./src/CardUtils";
import NibroCore from "./src/NibroCore";
import NibroMapUtils from "./src/MapUtils";
import NibroPF2E from "./src/PF2E";
import NibroTokenMarkerUtils from "./src/TokenMarkerUtils";
import NibroTokenUtils from "./src/TokenUtils";

NibroCore;
NibroMapUtils;
NibroCardUtils;
NibroTokenUtils;
NibroTokenMarkerUtils;
NibroPF2E;

namespace NibroSuite {
    export const version = getVersion()
    export const commit = getGitCommitHash()
    export const buildTime = getBuildTime()
    log(`NibroSuite Version: ${version}(${buildTime})`)
}
