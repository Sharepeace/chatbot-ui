const { createServer } = require("http");
const { parse } = require("url");
const { apiResolver } = require("next/dist/server/api-utils");
const { route } = require("next/dist/server/router");
const next = require("next");

const dev = process.env.NODE_ENV !== "production";
const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  createServer(async (req, res) => {
    const parsedUrl = parse(req.url, true);
    const { pathname } = parsedUrl;

    if (pathname.startsWith("/api/")) {
      const apiReq = req;
      const apiRes = res;
      apiReq.url = apiReq.url.replace(/^\/api/, "");

      try {
        const bodyParser = require("micro/lib/index");
        apiReq.body = await bodyParser(apiReq, { limit: "10mb" }); // Adjust the limit as needed
      } catch (error) {
        console.error("Error parsing the request body:", error);
      }

      return apiResolver(apiReq, apiRes, parsedUrl.query, await route(""));
    }

    handle(req, res, parsedUrl);
  }).listen(3000, (err) => {
    if (err) throw err;
    console.log("> Ready on http://localhost:3000");
  });
});
