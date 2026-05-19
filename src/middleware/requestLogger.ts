import { NextFunction, Request, Response } from "express";

export function requestLogger(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const start = Date.now();
  const traceHeader = req.header("X-Cloud-Trace-Context");

  res.on("finish", () => {
    const durationMs = Date.now() - start;
    const log = {
      severity: res.statusCode >= 500 ? "ERROR" : "INFO",
      message: "http_request",
      httpRequest: {
        requestMethod: req.method,
        requestUrl: req.originalUrl,
        status: res.statusCode,
        responseSize: Number(res.getHeader("Content-Length") ?? 0),
        userAgent: req.header("User-Agent") ?? "",
        remoteIp: req.ip,
      },
      trace: traceHeader
        ? `projects/${process.env.GOOGLE_CLOUD_PROJECT}/traces/${traceHeader.split("/")[0]}`
        : undefined,
      durationMs,
    };

    console.log(JSON.stringify(log));
  });

  next();
}
