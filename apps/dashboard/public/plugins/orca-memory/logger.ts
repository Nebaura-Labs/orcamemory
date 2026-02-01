type Logger = {
  info?: (message: string) => void;
  warn?: (message: string) => void;
  error?: (message: string) => void;
  debug?: (message: string) => void;
};

let activeLogger: Logger | null = null;
let debugEnabled = false;

export const initLogger = (logger: Logger | undefined, enableDebug: boolean) => {
  activeLogger = logger ?? null;
  debugEnabled = enableDebug;
};

export const log = {
  info: (message: string) => {
    activeLogger?.info?.(message);
  },
  warn: (message: string) => {
    activeLogger?.warn?.(message);
  },
  error: (message: string, err?: unknown) => {
    if (err) {
      activeLogger?.error?.(`${message}: ${String(err)}`);
    } else {
      activeLogger?.error?.(message);
    }
  },
  debug: (message: string) => {
    if (!debugEnabled) return;
    activeLogger?.debug?.(message);
  },
};
