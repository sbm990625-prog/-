import { Config } from "@remotion/cli/config";
import { existsSync } from "node:fs";

Config.setVideoImageFormat("jpeg");
Config.setOverwriteOutput(true);
Config.setConcurrency(4);
Config.setJpegQuality(90);
// 일반 플레이어 호환: 제한 범위 yuv420p + BT.709 (기본값은 JPEG 풀레인지 yuvj420p 로 나온다)
Config.setPixelFormat("yuv420p");
Config.setColorSpace("bt709");

// 클라우드 컨테이너에 사전 설치된 Playwright Chromium을 재사용한다.
// 로컬에서는 없으면 Remotion이 Chrome Headless Shell을 내려받아 쓴다.
const PW_CHROME = "/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell";
if (!process.env.REMOTION_BROWSER_EXECUTABLE && existsSync(PW_CHROME)) {
  Config.setBrowserExecutable(PW_CHROME);
}
Config.setChromiumOpenGlRenderer("angle");
